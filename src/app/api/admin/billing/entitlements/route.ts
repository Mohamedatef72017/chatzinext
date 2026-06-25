import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/server/auth/guards";
import { setEntitlementOverride } from "@/lib/entitlements";
import { writeBillingAudit } from "@/lib/billing/billing-audit";

const schema = z.object({
  tenantId: z.string().min(1),
  key: z.string().min(1),
  value: z.union([z.number(), z.boolean()]),
  expiresAt: z.string().datetime().optional()
});

export async function POST(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = schema.parse(await request.json());

    await setEntitlementOverride(
      body.tenantId,
      body.key,
      body.value,
      body.expiresAt ? new Date(body.expiresAt) : undefined
    );

    await writeBillingAudit({
      actorId: session.user.id,
      actorEmail: session.user.email ?? "",
      action: "entitlement.override_set",
      targetType: "Tenant",
      targetId: body.tenantId,
      after: { key: body.key, value: body.value, expiresAt: body.expiresAt }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر التحديث." }, { status: 400 });
  }
}
