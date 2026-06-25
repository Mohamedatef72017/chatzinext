import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/server/auth/guards";
import { BillingPlan } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { writeBillingAudit } from "@/lib/billing/billing-audit";

const planFeatureSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["boolean", "quota", "count", "storage", "metered"]),
  enabled: z.boolean().optional().default(false),
  limit: z.number().min(0).optional().default(0),
  resetPeriod: z.enum(["monthly", "yearly", "never"]).optional().default("never"),
  overageAllowed: z.boolean().optional().default(false),
  overagePriceCents: z.number().min(0).optional().default(0),
  unit: z.string().optional().default("")
});

const createSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  interval: z.enum(["month", "year"]),
  priceCents: z.number().min(0),
  currency: z.string().min(3).max(3).default("usd"),
  aiMessageLimit: z.number().min(0).optional().default(0),
  stripePriceId: z.string().optional(),
  providerPriceId: z.string().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  isCustom: z.boolean().optional(),
  tenantId: z.string().optional(),
  features: z.array(planFeatureSchema).optional().default([])
});

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const { searchParams } = new URL(request.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    await connectToDatabase();

    const filter: Record<string, unknown> = { createdByAdmin: true };
    if (!includeArchived) filter.isArchived = { $ne: true };

    const plans = await BillingPlan.find(filter)
      .sort({ interval: 1, priceCents: 1 })
      .lean();

    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = createSchema.parse(await request.json());
    await connectToDatabase();

    // Auto-build ai_messages feature from aiMessageLimit if features not provided or incomplete
    const features = body.features ?? [];
    const hasAiMessages = features.some((f) => f.key === "ai_messages");
    if (!hasAiMessages && (body.aiMessageLimit ?? 0) > 0) {
      features.push({
        key: "ai_messages",
        type: "quota",
        enabled: false,
        limit: body.aiMessageLimit ?? 0,
        resetPeriod: "monthly",
        overageAllowed: false,
        overagePriceCents: 0,
        unit: "message"
      });
    }

    const plan = await BillingPlan.create({
      tenantId: body.tenantId ?? null,
      name: body.name,
      description: body.description ?? "",
      interval: body.interval,
      priceCents: body.priceCents,
      currency: body.currency.toLowerCase(),
      aiMessageLimit: body.aiMessageLimit ?? 0,
      stripePriceId: body.stripePriceId?.trim() ?? "",
      providerPriceId: body.providerPriceId?.trim() ?? "",
      createdByAdmin: true,
      isPopular: body.isPopular ?? false,
      isActive: body.isActive ?? true,
      isHidden: body.isHidden ?? false,
      isCustom: body.isCustom ?? false,
      features,
      version: 1
    });

    await writeBillingAudit({
      actorId: session.user.id,
      actorEmail: session.user.email ?? "",
      action: "plan.created",
      targetType: "BillingPlan",
      targetId: plan._id.toString(),
      after: { name: plan.name, priceCents: plan.priceCents, interval: plan.interval }
    });

    return NextResponse.json({ id: plan._id.toString() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر حفظ الخطة.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
