import { NextResponse } from "next/server";
import { z } from "zod";
import { createStripeCheckout } from "@/lib/billing";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";

const schema = z.object({
  kind: z.enum(["plan", "pack"]),
  itemId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const session = await requirePermission(permissions.billingManage);
    const body = schema.parse(await request.json());
    const url = await createStripeCheckout({
      tenantId: session.user.tenantId,
      userId: session.user.id,
      email: session.user.email,
      kind: body.kind,
      itemId: body.itemId
    });

    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "تعذر بدء الدفع.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
