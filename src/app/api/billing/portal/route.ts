import { NextResponse } from "next/server";
import { createStripePortalSession } from "@/lib/billing";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";

export async function POST(request: Request) {
  try {
    const session = await requirePermission(permissions.billingManage);
    const url = await createStripePortalSession(session.user.tenantId);
    
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر فتح بوابة الدفع.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
