import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/server/auth/guards";
import { BillingPlan } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { writeBillingAudit } from "@/lib/billing/billing-audit";

const featureSchema = z.object({
  key: z.string().min(1),
  type: z.enum(["boolean", "quota", "count", "storage", "metered"]),
  enabled: z.boolean().optional().default(false),
  limit: z.number().min(0).optional().default(0),
  resetPeriod: z.enum(["monthly", "yearly", "never"]).optional().default("never"),
  overageAllowed: z.boolean().optional().default(false),
  overagePriceCents: z.number().min(0).optional().default(0),
  unit: z.string().optional().default("")
});

/** PUT /api/admin/billing/plans/:id/features — replace the full features array */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const { id } = await params;
    const body = z.array(featureSchema).parse(await request.json());
    await connectToDatabase();

    const before = await BillingPlan.findById(id).lean();
    if (!before) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

    const updated = await BillingPlan.findByIdAndUpdate(
      id,
      {
        $set: {
          features: body,
          version: ((before as any).version ?? 1) + 1
        }
      },
      { new: true }
    ).lean();

    await writeBillingAudit({
      actorId: session.user.id,
      actorEmail: session.user.email ?? "",
      action: "plan.feature_updated",
      targetType: "BillingPlan",
      targetId: id,
      before: { features: (before as any).features },
      after: { features: body }
    });

    return NextResponse.json({ success: true, features: (updated as any).features });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر التحديث." }, { status: 400 });
  }
}

/** PATCH /api/admin/billing/plans/:id/features — upsert a single feature */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const { id } = await params;
    const feature = featureSchema.parse(await request.json());
    await connectToDatabase();

    const plan = await BillingPlan.findById(id).lean();
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

    const features: any[] = (plan as any).features ?? [];
    const idx = features.findIndex((f: any) => f.key === feature.key);

    if (idx >= 0) {
      features[idx] = feature;
    } else {
      features.push(feature);
    }

    await BillingPlan.findByIdAndUpdate(id, {
      $set: { features, version: ((plan as any).version ?? 1) + 1 }
    });

    await writeBillingAudit({
      actorId: session.user.id,
      actorEmail: session.user.email ?? "",
      action: idx >= 0 ? "plan.feature_updated" : "plan.feature_added",
      targetType: "BillingPlan",
      targetId: id,
      after: feature
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر التحديث." }, { status: 400 });
  }
}

/** DELETE /api/admin/billing/plans/:id/features?key=xxx — remove a feature */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    if (!key) return NextResponse.json({ error: "Feature key required." }, { status: 400 });

    await connectToDatabase();
    const plan = await BillingPlan.findById(id).lean();
    if (!plan) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

    const features = ((plan as any).features ?? []).filter((f: any) => f.key !== key);
    await BillingPlan.findByIdAndUpdate(id, { $set: { features } });

    await writeBillingAudit({
      actorId: session.user.id,
      actorEmail: session.user.email ?? "",
      action: "plan.feature_removed",
      targetType: "BillingPlan",
      targetId: id,
      note: `Removed feature: ${key}`
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر الحذف." }, { status: 400 });
  }
}
