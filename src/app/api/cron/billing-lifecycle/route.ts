/**
 * /api/cron/billing-lifecycle
 *
 * Production-ready cron endpoint for trial and grace-period lifecycle enforcement.
 * Must be triggered by an external scheduler (e.g. Vercel Cron, Upstash, render.com).
 *
 * Secured by CRON_SECRET header check — do not expose without authentication.
 *
 * Runs two passes on every invocation:
 *   1. Trial expiry   — trialing subscriptions past trialEndsAt
 *   2. Grace expiry   — past_due subscriptions past graceEndsAt
 *
 * Both passes are idempotent and safe to run multiple times.
 */

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { TenantSubscription } from "@/lib/models";
import { stripeProvider } from "@/lib/billing/providers/stripe.provider";
import { appendSubscriptionHistory } from "@/lib/billing/subscription-history-helper";
import { writeBillingAudit } from "@/lib/billing/billing-audit";
import { logger } from "@/lib/logger";

const CRON_SECRET = process.env.CRON_SECRET;

function isAuthorized(request: Request): boolean {
  if (!CRON_SECRET) return false;
  const authHeader = request.headers.get("authorization");
  const secretHeader = request.headers.get("x-cron-secret");
  if (authHeader === `Bearer ${CRON_SECRET}`) return true;
  if (secretHeader === CRON_SECRET) return true;
  return false;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const now = new Date();
  const results = { trialExpired: 0, graceExpired: 0, errors: 0 };

  // ── Pass 1: Trial expiry ──────────────────────────────────────────────────
  const trialExpired = await TenantSubscription.find({
    status: "trialing",
    trialEndsAt: { $lte: now }
  }).lean();

  for (const sub of trialExpired) {
    try {
      let newStatus: string;

      if (sub.stripeSubscriptionId) {
        try {
          const stripeState = await stripeProvider.retrieveSubscription(
            sub.stripeSubscriptionId
          );
          newStatus = stripeState.status === "active" ? "active" : "canceled";
        } catch {
          newStatus = "canceled";
        }
      } else {
        // No payment method attached — end trial
        newStatus = "canceled";
      }

      await TenantSubscription.updateOne(
        { _id: sub._id },
        { $set: { status: newStatus } }
      );

      await appendSubscriptionHistory({
        tenantId: sub.tenantId.toString(),
        planId: sub.planId?.toString(),
        fromStatus: "trialing",
        toStatus: newStatus,
        transition: newStatus === "active" ? "trial_converted" : "trial_expired",
        actor: "system",
        note: `Trial ended at ${sub.trialEndsAt?.toISOString()}`
      });

      await writeBillingAudit({
        actorId: "system",
        action: newStatus === "active" ? "trial.converted" : "trial.expired",
        targetType: "TenantSubscription",
        targetId: sub._id.toString(),
        before: { status: "trialing" },
        after: { status: newStatus }
      });

      results.trialExpired++;
      logger.info("billing_lifecycle.trial_processed", {
        tenantId: sub.tenantId.toString(),
        newStatus
      });
    } catch (err) {
      results.errors++;
      logger.error("billing_lifecycle.trial_error", {
        tenantId: sub.tenantId.toString(),
        error: err instanceof Error ? err.message : "unknown"
      });
    }
  }

  // ── Pass 2: Grace period expiry ──────────────────────────────────────────
  const graceExpired = await TenantSubscription.find({
    status: "past_due",
    graceEndsAt: { $lte: now }
  }).lean();

  for (const sub of graceExpired) {
    try {
      // Cancel the Stripe subscription if present
      if (sub.stripeSubscriptionId) {
        try {
          await stripeProvider.cancelSubscription({
            providerSubscriptionId: sub.stripeSubscriptionId,
            immediately: true
          });
        } catch {
          // Stripe may have already canceled — continue with local update
        }
      }

      await TenantSubscription.updateOne(
        { _id: sub._id },
        { $set: { status: "canceled", currentPeriodEnd: now } }
      );

      await appendSubscriptionHistory({
        tenantId: sub.tenantId.toString(),
        planId: sub.planId?.toString(),
        fromStatus: "past_due",
        toStatus: "canceled",
        transition: "grace_expired",
        actor: "system",
        note: `Grace period ended at ${sub.graceEndsAt?.toISOString()}`
      });

      await writeBillingAudit({
        actorId: "system",
        action: "grace.expired",
        targetType: "TenantSubscription",
        targetId: sub._id.toString(),
        before: { status: "past_due" },
        after: { status: "canceled" }
      });

      results.graceExpired++;
      logger.info("billing_lifecycle.grace_expired", {
        tenantId: sub.tenantId.toString()
      });
    } catch (err) {
      results.errors++;
      logger.error("billing_lifecycle.grace_error", {
        tenantId: sub.tenantId.toString(),
        error: err instanceof Error ? err.message : "unknown"
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processedAt: now.toISOString(),
    ...results
  });
}

// Also support GET for health-check / manual trigger from dashboard
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await connectToDatabase();
  const now = new Date();
  const [pendingTrials, pendingGrace] = await Promise.all([
    TenantSubscription.countDocuments({ status: "trialing", trialEndsAt: { $lte: now } }),
    TenantSubscription.countDocuments({ status: "past_due", graceEndsAt: { $lte: now } })
  ]);
  return NextResponse.json({ pendingTrials, pendingGrace });
}
