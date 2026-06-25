import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/server/auth/guards";
import { BillingPlan } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { writeBillingAudit } from "@/lib/billing/billing-audit";

const planFeatureSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["boolean", "quota", "count", "storage", "metered"]),
  enabled: z.boolean().optional(),
  limit: z.number().min(0).optional(),
  resetPeriod: z.enum(["monthly", "yearly", "never"]).optional(),
  overageAllowed: z.boolean().optional(),
  overagePriceCents: z.number().min(0).optional(),
  unit: z.string().optional()
});

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  interval: z.enum(["month", "year"]).optional(),
  priceCents: z.number().min(0).optional(),
  currency: z.string().min(3).max(3).optional(),
  aiMessageLimit: z.number().min(0).optional(),
  stripePriceId: z.string().optional(),
  providerPriceId: z.string().optional(),
  isPopular: z.boolean().optional(),
  isActive: z.boolean().optional(),
  isHidden: z.boolean().optional(),
  features: z.array(planFeatureSchema).optional()
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await params;
    await connectToDatabase();
    const plan = await BillingPlan.findById(id).lean();
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });
    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    await connectToDatabase();

    const before = await BillingPlan.findById(id).lean();
    if (!before) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

    const updateFields: Record<string, unknown> = {};
    if (body.name !== undefined) updateFields.name = body.name;
    if (body.description !== undefined) updateFields.description = body.description;
    if (body.interval !== undefined) updateFields.interval = body.interval;
    if (body.priceCents !== undefined) updateFields.priceCents = body.priceCents;
    if (body.currency !== undefined) updateFields.currency = body.currency.toLowerCase();
    if (body.aiMessageLimit !== undefined) updateFields.aiMessageLimit = body.aiMessageLimit;
    if (body.stripePriceId !== undefined) updateFields.stripePriceId = body.stripePriceId.trim();
    if (body.providerPriceId !== undefined) updateFields.providerPriceId = body.providerPriceId.trim();
    if (body.isPopular !== undefined) updateFields.isPopular = body.isPopular;
    if (body.isActive !== undefined) updateFields.isActive = body.isActive;
    if (body.isHidden !== undefined) updateFields.isHidden = body.isHidden;
    if (body.features !== undefined) {
      updateFields.features = body.features;
      updateFields.version = ((before as any).version ?? 1) + 1;
    }

    const updated = await BillingPlan.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    await writeBillingAudit({
      actorId: session.user.id,
      actorEmail: session.user.email ?? "",
      action: "plan.updated",
      targetType: "BillingPlan",
      targetId: id,
      before,
      after: updated
    });

    return NextResponse.json({ success: true, plan: updated });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر التحديث." }, { status: 400 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const { id } = await params;
    await connectToDatabase();

    const plan = await BillingPlan.findById(id).lean();
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

    await BillingPlan.findByIdAndUpdate(id, { $set: { isArchived: true, isActive: false } });

    await writeBillingAudit({
      actorId: session.user.id,
      actorEmail: session.user.email ?? "",
      action: "plan.archived",
      targetType: "BillingPlan",
      targetId: id,
      before: plan,
      after: { isArchived: true, isActive: false }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر الأرشفة." }, { status: 400 });
  }
}
