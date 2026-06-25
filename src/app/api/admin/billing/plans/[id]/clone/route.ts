import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/server/auth/guards";
import { BillingPlan } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { writeBillingAudit } from "@/lib/billing/billing-audit";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSuperAdmin();
    const { id } = await params;
    await connectToDatabase();

    const original = await BillingPlan.findById(id).lean();
    if (!original) return NextResponse.json({ error: "Plan not found." }, { status: 404 });

    const { _id, createdAt, updatedAt, ...rest } = original as any;

    const cloned = await BillingPlan.create({
      ...rest,
      name: `${rest.name} (Copy)`,
      slug: `${rest.slug ?? ""}-copy-${Date.now()}`,
      isActive: false,
      isArchived: false,
      version: 1,
      createdByAdmin: true
    });

    await writeBillingAudit({
      actorId: session.user.id,
      actorEmail: session.user.email ?? "",
      action: "plan.cloned",
      targetType: "BillingPlan",
      targetId: cloned._id.toString(),
      note: `Cloned from plan ${id} (${rest.name})`
    });

    return NextResponse.json({ id: cloned._id.toString(), success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر الاستنساخ." }, { status: 400 });
  }
}
