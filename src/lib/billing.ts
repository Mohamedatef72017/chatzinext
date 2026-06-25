/**
 * billing.ts
 *
 * Public billing API — backward-compatible with all existing call-sites.
 * Internally uses the payment-provider abstraction (StripePaymentProvider).
 * Business logic no longer imports Stripe directly.
 */

import { Types } from "mongoose";
import {
  BillingPlan,
  MessagePack,
  PaymentEvent,
  TenantSubscription,
  SubscriptionHistory,
  type BillingPlanDocument,
  type MessagePackDocument
} from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { absoluteUrl } from "@/lib/strings";
import { stripeProvider } from "@/lib/billing/providers/stripe.provider";
import { publishRealtimeEvent } from "@/lib/realtime";
import { writeBillingAudit } from "@/lib/billing/billing-audit";
import { FEATURE_KEYS } from "@/lib/billing/feature-registry";
import type { Stripe } from "stripe";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function assertValidObjectId(value: string, label: string) {
  if (!Types.ObjectId.isValid(value)) throw new Error(`${label} is invalid.`);
}

async function appendSubscriptionHistory(params: {
  tenantId: string;
  planId?: string;
  planName?: string;
  fromStatus?: string;
  toStatus: string;
  transition: string;
  actor?: "system" | "tenant" | "admin" | "stripe";
  actorId?: string;
  note?: string;
}) {
  try {
    await SubscriptionHistory.create({
      tenantId: new Types.ObjectId(params.tenantId),
      planId: params.planId ? new Types.ObjectId(params.planId) : undefined,
      planName: params.planName ?? "",
      fromStatus: params.fromStatus ?? "",
      toStatus: params.toStatus,
      transition: params.transition,
      actor: params.actor ?? "system",
      actorId: params.actorId ?? "",
      note: params.note ?? ""
    });
  } catch {
    // History failures must never block the main operation
  }
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

export async function getBillingCatalog(tenantId: string) {
  await connectToDatabase();
  const [plans, packs] = await Promise.all([
    BillingPlan.find({
      $or: [{ tenantId: null }, { tenantId }, { tenantId: { $exists: false } }],
      createdByAdmin: true,
      isActive: true,
      isArchived: { $ne: true }
    }).sort({ interval: 1, priceCents: 1 }).lean(),
    MessagePack.find({
      $or: [{ tenantId: null }, { tenantId }, { tenantId: { $exists: false } }],
      createdByAdmin: true
    }).sort({ sortOrder: 1, priceCents: 1 }).lean()
  ]);

  let subscription = await TenantSubscription.findOne({ tenantId }).populate("planId").lean();

  if (!subscription) {
    const freePlan = plans.find((p) => p.name.toLowerCase() === "free");
    if (freePlan) {
      subscription = {
        status: "active",
        monthlyMessageLimit: freePlan.aiMessageLimit ?? 0,
        usedMessages: 0,
        extraMessageCredits: 0,
        planId: freePlan,
        tenantId: tenantId as any
      } as any;
    }
  }

  return {
    plans: plans.map(serializePlan),
    packs: packs.map(serializePack),
    subscription: subscription
      ? {
          status: subscription.status,
          monthlyMessageLimit: subscription.monthlyMessageLimit,
          usedMessages: subscription.usedMessages,
          extraMessageCredits: subscription.extraMessageCredits,
          graceMessageLimit: (subscription as any).graceMessageLimit ?? 20,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() || "",
          planName: subscription.planId ? (subscription.planId as any).name : "الخطة المجانية",
          trialEndsAt: (subscription as any).trialEndsAt?.toISOString() ?? null,
          graceEndsAt: (subscription as any).graceEndsAt?.toISOString() ?? null,
          cancelAtPeriodEnd: (subscription as any).cancelAtPeriodEnd ?? false
        }
      : null
  };
}

export function serializePlan(plan: BillingPlanDocument & { _id: Types.ObjectId }) {
  return {
    id: plan._id.toString(),
    name: plan.name,
    slug: plan.slug ?? "",
    description: plan.description || "",
    interval: plan.interval,
    priceCents: plan.priceCents,
    currency: plan.currency,
    aiMessageLimit: plan.aiMessageLimit,
    stripePriceId: plan.stripePriceId || "",
    isPopular: plan.isPopular,
    isActive: plan.isActive,
    isArchived: plan.isArchived ?? false,
    isHidden: plan.isHidden ?? false,
    isCustom: plan.isCustom ?? false,
    version: plan.version ?? 1,
    features: (plan as any).features ?? []
  };
}

export function serializePack(pack: MessagePackDocument & { _id: Types.ObjectId }) {
  return {
    id: pack._id.toString(),
    name: pack.name,
    messageCredits: pack.messageCredits,
    priceCents: pack.priceCents,
    currency: pack.currency,
    stripePriceId: pack.stripePriceId || "",
    sortOrder: pack.sortOrder,
    isActive: pack.isActive
  };
}

// ─── AI message guards (backward compat) ─────────────────────────────────────

export async function assertCanSendAiMessage(tenantId: string) {
  await connectToDatabase();
  const subscription = await TenantSubscription.findOne({ tenantId });
  if (!subscription) return;

  const allowance = subscription.monthlyMessageLimit + subscription.extraMessageCredits;
  if (allowance <= 0) return;

  const grace = Number((subscription as any).graceMessageLimit ?? 20);
  if (subscription.usedMessages >= allowance + Math.max(0, grace)) {
    throw new Error("AI message limit exceeded. Add a message pack or upgrade the plan.");
  }
}

export async function recordAiMessageUsage(tenantId: string) {
  const subscription = await TenantSubscription.findOneAndUpdate(
    { tenantId },
    { $inc: { usedMessages: 1 } },
    { new: true, upsert: false }
  );
  if (!subscription) return;

  const allowance = subscription.monthlyMessageLimit + subscription.extraMessageCredits;
  if (allowance <= 0) return;

  const used = subscription.usedMessages || 0;
  const grace = Number((subscription as any).graceMessageLimit ?? 20);
  const percent = Math.round((used / allowance) * 100);
  const remaining = Math.max(allowance - used, 0);
  const graceRemaining = Math.max(allowance + grace - used, 0);

  if (percent >= 80 || used >= allowance) {
    await publishRealtimeEvent(tenantId, "billing.usage.updated", {
      usage: {
        usedMessages: used,
        monthlyMessageLimit: subscription.monthlyMessageLimit,
        extraMessageCredits: subscription.extraMessageCredits,
        graceMessageLimit: grace,
        percent,
        remaining,
        graceRemaining,
        level: used >= allowance ? "grace" : percent >= 90 ? "danger" : "warning"
      }
    }).catch(() => undefined);
  }
}

// ─── Checkout ─────────────────────────────────────────────────────────────────

export async function createStripeCheckout(input: {
  tenantId: string;
  userId: string;
  email?: string | null;
  kind: "plan" | "pack";
  itemId: string;
}) {
  await connectToDatabase();
  assertValidObjectId(input.tenantId, "Tenant id");
  assertValidObjectId(input.userId, "User id");
  assertValidObjectId(input.itemId, "Billing item id");

  if (input.kind === "plan") {
    const plan = await BillingPlan.findOne({
      _id: input.itemId,
      $or: [{ tenantId: null }, { tenantId: input.tenantId }, { tenantId: { $exists: false } }],
      createdByAdmin: true,
      isActive: true
    });
    if (!plan) throw new Error("خطة الدفع غير موجودة أو غير مفعلة.");

    const result = await stripeProvider.createCheckoutSession({
      tenantId: input.tenantId,
      userId: input.userId,
      email: input.email,
      kind: "plan",
      itemId: input.itemId,
      planName: plan.name,
      planDescription: `${plan.aiMessageLimit} AI messages`,
      priceCents: plan.priceCents,
      currency: plan.currency || process.env.STRIPE_CURRENCY || "usd",
      interval: plan.interval as "month" | "year",
      providerPriceId: plan.stripePriceId || plan.providerPriceId || undefined,
      successUrl: absoluteUrl("/dashboard/billing?success=1&session_id={CHECKOUT_SESSION_ID}"),
      cancelUrl: absoluteUrl("/dashboard/billing?canceled=1"),
      metadata: { tenantId: input.tenantId, userId: input.userId, kind: "plan", itemId: input.itemId }
    });
    return result.url;
  }

  const pack = await MessagePack.findOne({
    _id: input.itemId,
    $or: [{ tenantId: null }, { tenantId: input.tenantId }, { tenantId: { $exists: false } }],
    createdByAdmin: true,
    isActive: true
  });
  if (!pack) throw new Error("باقة الرسائل غير موجودة أو غير مفعلة.");

  const result = await stripeProvider.createCheckoutSession({
    tenantId: input.tenantId,
    userId: input.userId,
    email: input.email,
    kind: "pack",
    itemId: input.itemId,
    planName: pack.name,
    planDescription: `${pack.messageCredits} AI messages`,
    priceCents: pack.priceCents,
    currency: pack.currency || process.env.STRIPE_CURRENCY || "usd",
    providerPriceId: pack.stripePriceId || undefined,
    successUrl: absoluteUrl("/dashboard/billing?success=1&session_id={CHECKOUT_SESSION_ID}"),
    cancelUrl: absoluteUrl("/dashboard/billing?canceled=1"),
    metadata: { tenantId: input.tenantId, userId: input.userId, kind: "pack", itemId: input.itemId }
  });
  return result.url;
}

// ─── Stripe Portal ────────────────────────────────────────────────────────────

export async function createStripePortalSession(tenantId: string) {
  await connectToDatabase();
  const subscription = await TenantSubscription.findOne({ tenantId });
  if (!subscription || !subscription.stripeCustomerId) {
    throw new Error("لا يوجد حساب دفع مرتبط حالياً بـ Stripe.");
  }
  const result = await stripeProvider.createPortalSession({
    providerCustomerId: subscription.stripeCustomerId,
    returnUrl: absoluteUrl("/dashboard/billing")
  });
  return result.url;
}

// ─── Stripe Webhook handler ───────────────────────────────────────────────────

export async function handleStripeEvent(event: Stripe.Event) {
  await connectToDatabase();

  const eventIdToTrack = event.type === "checkout.session.completed"
    ? (event.data.object as any).id
    : event.id;

  const exists = await PaymentEvent.exists({ stripeEventId: eventIdToTrack });
  if (exists) return;

  let paymentEvent;
  try {
    paymentEvent = await PaymentEvent.create({
      stripeEventId: eventIdToTrack,
      type: event.type,
      payload: event,
      status: "received"
    });
  } catch (error: any) {
    if (error?.code === 11000) return;
    throw error;
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "customer.subscription.updated") {
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
    } else if (event.type === "customer.subscription.deleted") {
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
    } else if (event.type === "invoice.payment_succeeded") {
      await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
    } else if (event.type === "invoice.payment_failed") {
      await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
    }
    paymentEvent.status = "processed";
    await paymentEvent.save();
  } catch (error) {
    paymentEvent.status = "error";
    paymentEvent.error = error instanceof Error ? error.message : "Stripe webhook error";
    await paymentEvent.save();
    throw error;
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const tenantId = session.metadata?.tenantId;
  const kind = session.metadata?.kind;
  const itemId = session.metadata?.itemId;
  if (!tenantId || !kind || !itemId) return;
  if (!Types.ObjectId.isValid(tenantId) || !Types.ObjectId.isValid(itemId)) return;

  if (kind === "plan") {
    const plan = await BillingPlan.findOne({
      _id: itemId,
      $or: [{ tenantId: null }, { tenantId }, { tenantId: { $exists: false } }],
      createdByAdmin: true,
      isActive: true
    });
    if (!plan) return;

    const stripeSubscriptionId =
      typeof session.subscription === "string" ? session.subscription : "";
    let currentPeriodEnd: Date | null = null;
    let currentPeriodStart: Date | null = null;

    if (stripeSubscriptionId) {
      try {
        const state = await stripeProvider.retrieveSubscription(stripeSubscriptionId);
        currentPeriodEnd = state.currentPeriodEnd;
        currentPeriodStart = state.currentPeriodStart;
      } catch {
        // Non-fatal
      }
    }

    const prevSub = await TenantSubscription.findOne({ tenantId }).lean();

    await TenantSubscription.findOneAndUpdate(
      { tenantId },
      {
        $set: {
          tenantId,
          planId: plan._id,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : "",
          providerCustomerId: typeof session.customer === "string" ? session.customer : "",
          stripeSubscriptionId,
          providerSubscriptionId: stripeSubscriptionId,
          provider: "stripe",
          status: "active",
          monthlyMessageLimit: plan.aiMessageLimit ?? 0,
          usedMessages: 0,
          planSnapshot: { name: plan.name, features: (plan as any).features ?? [] },
          ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
          ...(currentPeriodStart ? { currentPeriodStart } : {})
        }
      },
      { upsert: true, new: true }
    );

    await appendSubscriptionHistory({
      tenantId,
      planId: plan._id.toString(),
      planName: plan.name,
      fromStatus: (prevSub as any)?.status ?? "",
      toStatus: "active",
      transition: prevSub ? "upgraded" : "created",
      actor: "stripe",
      note: `Checkout session ${session.id}`
    });
  }

  if (kind === "pack") {
    if (session.payment_status !== "paid") return;
    const pack = await MessagePack.findOne({
      _id: itemId,
      $or: [{ tenantId: null }, { tenantId }, { tenantId: { $exists: false } }],
      createdByAdmin: true,
      isActive: true
    });
    if (!pack) return;
    await TenantSubscription.findOneAndUpdate(
      { tenantId },
      {
        $setOnInsert: { tenantId, status: "active", monthlyMessageLimit: 0, usedMessages: 0 },
        $inc: { extraMessageCredits: pack.messageCredits }
      },
      { upsert: true, new: true }
    );
    await appendSubscriptionHistory({
      tenantId,
      toStatus: "active",
      transition: "credits_added",
      actor: "stripe",
      note: `Pack ${pack.name}: +${pack.messageCredits} credits`
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const itemPeriodEnd = subscription.items.data[0]?.current_period_end;
  const itemPeriodStart = subscription.items.data[0]?.current_period_start;
  const currentPeriodEnd = itemPeriodEnd ? new Date(itemPeriodEnd * 1000) : null;
  const currentPeriodStart = itemPeriodStart ? new Date(itemPeriodStart * 1000) : null;

  const prevSub = await TenantSubscription.findOne({
    stripeSubscriptionId: subscription.id
  }).lean();

  await TenantSubscription.updateOne(
    { stripeSubscriptionId: subscription.id },
    {
      $set: {
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
        ...(currentPeriodStart ? { currentPeriodStart } : {})
      }
    }
  );

  if (prevSub && prevSub.status !== subscription.status) {
    await appendSubscriptionHistory({
      tenantId: prevSub.tenantId.toString(),
      fromStatus: prevSub.status,
      toStatus: subscription.status,
      transition: subscription.cancel_at_period_end ? "canceled" : "renewed",
      actor: "stripe"
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const itemPeriodEnd = subscription.items.data[0]?.current_period_end;
  const currentPeriodEnd = itemPeriodEnd ? new Date(itemPeriodEnd * 1000) : null;

  const prevSub = await TenantSubscription.findOne({
    stripeSubscriptionId: subscription.id
  }).lean();

  await TenantSubscription.updateOne(
    { stripeSubscriptionId: subscription.id },
    { $set: { status: "canceled", ...(currentPeriodEnd ? { currentPeriodEnd } : {}) } }
  );

  if (prevSub) {
    await appendSubscriptionHistory({
      tenantId: prevSub.tenantId.toString(),
      fromStatus: prevSub.status,
      toStatus: "canceled",
      transition: "canceled",
      actor: "stripe"
    });
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof subscription === "string" ? subscription : subscription?.id;
  if (invoice.billing_reason === "subscription_cycle" && subscriptionId) {
    const sub = await TenantSubscription.findOne({ stripeSubscriptionId: subscriptionId });
    if (sub) {
      await TenantSubscription.updateOne(
        { _id: sub._id },
        { $set: { usedMessages: 0, status: "active" } }
      );
      await appendSubscriptionHistory({
        tenantId: sub.tenantId.toString(),
        fromStatus: sub.status,
        toStatus: "active",
        transition: "renewed",
        actor: "stripe"
      });
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscription = invoice.parent?.subscription_details?.subscription;
  const subscriptionId = typeof subscription === "string" ? subscription : subscription?.id;
  if (subscriptionId) {
    const sub = await TenantSubscription.findOne({ stripeSubscriptionId: subscriptionId });
    if (sub) {
      await TenantSubscription.updateOne(
        { stripeSubscriptionId: subscriptionId },
        { $set: { status: "past_due" } }
      );
      await appendSubscriptionHistory({
        tenantId: sub.tenantId.toString(),
        fromStatus: sub.status,
        toStatus: "past_due",
        transition: "past_due",
        actor: "stripe"
      });
    }
  }
}

// ─── Manual checkout completion ───────────────────────────────────────────────

export async function completeStripeCheckout(sessionId: string, tenantId: string) {
  await connectToDatabase();
  assertValidObjectId(tenantId, "Tenant id");

  const exists = await PaymentEvent.exists({ stripeEventId: sessionId });
  if (exists) return;

  try {
    const { getStripe } = await import("@/lib/stripe");
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const sessionTenantId = session.metadata?.tenantId || session.client_reference_id;
    if (sessionTenantId !== tenantId) throw new Error("Session does not belong to this tenant.");

    const canComplete =
      session.payment_status === "paid" ||
      (session.mode === "subscription" && session.status === "complete" && !!session.subscription);

    if (canComplete) {
      const paymentEvent = await PaymentEvent.create({
        stripeEventId: sessionId,
        tenantId,
        type: "checkout.session.completed.manual",
        payload: session,
        status: "received"
      });
      await handleCheckoutCompleted(session);
      paymentEvent.status = "processed";
      await paymentEvent.save();
    }
  } catch (error) {
    console.error("Failed to complete checkout manually:", error);
  }
}

// ─── Subscription sync ────────────────────────────────────────────────────────

export async function syncSubscriptionWithStripe(tenantId: string) {
  await connectToDatabase();
  const sub = await TenantSubscription.findOne({ tenantId });
  if (!sub || !sub.stripeSubscriptionId) return;

  try {
    const state = await stripeProvider.retrieveSubscription(sub.stripeSubscriptionId);
    const isNewCycle =
      sub.currentPeriodEnd &&
      state.currentPeriodEnd &&
      sub.currentPeriodEnd < state.currentPeriodEnd &&
      state.status === "active";

    await TenantSubscription.updateOne(
      { _id: sub._id },
      {
        $set: {
          status: state.status,
          cancelAtPeriodEnd: state.cancelAtPeriodEnd,
          ...(state.currentPeriodEnd ? { currentPeriodEnd: state.currentPeriodEnd } : {}),
          ...(state.currentPeriodStart ? { currentPeriodStart: state.currentPeriodStart } : {}),
          ...(isNewCycle ? { usedMessages: 0 } : {})
        }
      }
    );
  } catch (error) {
    console.error(`Failed to sync subscription for tenant ${tenantId}:`, error);
  }
}

// ─── Admin: cancel subscription ───────────────────────────────────────────────

export async function cancelSubscriptionByAdmin(subscriptionId: string, actorId?: string) {
  await connectToDatabase();
  const sub = await TenantSubscription.findById(subscriptionId);
  if (!sub || !sub.stripeSubscriptionId) {
    throw new Error("تعذر إيجاد الاشتراك أو أنه غير مرتبط بـ Stripe.");
  }

  try {
    await stripeProvider.cancelSubscription({
      providerSubscriptionId: sub.stripeSubscriptionId,
      immediately: true
    });
  } catch (error) {
    console.error("Stripe cancel error:", error);
  }

  await TenantSubscription.updateOne(
    { _id: sub._id },
    { $set: { status: "canceled", currentPeriodEnd: new Date() } }
  );

  await appendSubscriptionHistory({
    tenantId: sub.tenantId.toString(),
    fromStatus: sub.status,
    toStatus: "canceled",
    transition: "canceled",
    actor: "admin",
    actorId: actorId ?? ""
  });

  if (actorId) {
    await writeBillingAudit({
      actorId,
      action: "subscription.canceled",
      targetType: "TenantSubscription",
      targetId: subscriptionId,
      before: { status: sub.status },
      after: { status: "canceled" }
    });
  }
}

// ─── Admin: analytics ─────────────────────────────────────────────────────────

export async function getSubscriptionAnalytics() {
  await connectToDatabase();

  const [totalRevenue, activeSubscriptions, byPlan] = await Promise.all([
    TenantSubscription.aggregate([
      { $match: { status: "active", planId: { $exists: true, $ne: null } } },
      { $lookup: { from: "billingplans", localField: "planId", foreignField: "_id", as: "plan" } },
      { $unwind: "$plan" },
      {
        $group: {
          _id: null,
          mrrCents: {
            $sum: {
              $cond: [
                { $eq: ["$plan.interval", "month"] },
                "$plan.priceCents",
                { $divide: ["$plan.priceCents", 12] }
              ]
            }
          }
        }
      }
    ]),
    TenantSubscription.countDocuments({ status: "active" }),
    TenantSubscription.aggregate([
      { $match: { status: "active", planId: { $exists: true, $ne: null } } },
      { $lookup: { from: "billingplans", localField: "planId", foreignField: "_id", as: "plan" } },
      { $unwind: "$plan" },
      { $group: { _id: "$plan.name", count: { $sum: 1 } } }
    ])
  ]);

  const freeUsersCount = await TenantSubscription.countDocuments({
    $or: [{ status: { $ne: "active" } }, { planId: null }]
  });

  return {
    mrrCents: totalRevenue[0]?.mrrCents || 0,
    activeCount: activeSubscriptions,
    distribution: [
      ...byPlan.map((p) => ({ name: p._id as string, count: p.count as number })),
      { name: "Free / Inactive", count: freeUsersCount }
    ]
  };
}

export async function getAllSubscriptions() {
  await connectToDatabase();
  const subs = await TenantSubscription.find()
    .populate("tenantId")
    .populate("planId")
    .sort({ createdAt: -1 })
    .lean();

  return subs.map((sub: any) => ({
    id: sub._id.toString(),
    tenantName: sub.tenantId?.name || "Unknown",
    tenantSlug: sub.tenantId?.slug || "",
    planName: sub.planId?.name || "الخطة المجانية",
    status: sub.status,
    usedMessages: sub.usedMessages,
    monthlyLimit: sub.monthlyMessageLimit,
    extraCredits: sub.extraMessageCredits,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || "",
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd ?? false,
    trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
    graceEndsAt: sub.graceEndsAt?.toISOString() ?? null
  }));
}
