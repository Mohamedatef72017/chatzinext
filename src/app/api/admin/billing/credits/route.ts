import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSuperAdmin } from "@/server/auth/guards";
import { TenantSubscription } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { writeBillingAudit } from "@/lib/billing/billing-audit";
import { grantCredits } from "@/lib/billing/wallet-service";

const schema = z.object({
  tenantId: z.string().min(1),
  credits: z.number().int().positive(),
  description: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const session = await requireSuperAdmin();
    const body = schema.parse(await request.json());
    await connectToDatabase();

    await TenantSubscription.findOneAndUpdate(
      { tenantId: body.tenantId },
      {
        $inc: { extraMessageCredits: body.credits },
        $setOnInsert: { status: "active", monthlyMessageLimit: 0, usedMessages: 0 }
      },
      { upsert: true }
    );

    await grantCredits(
      body.tenantId,
      body.credits,
      session.user.id,
      body.description ?? `Admin grant: ${body.credits} credits`
    );

    await writeBillingAudit({
      actorId: session.user.id,
      actorEmail: session.user.email ?? "",
      action: "credits.granted",
      targetType: "Tenant",
      targetId: body.tenantId,
      after: { credits: body.credits, description: body.description }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "تعذر منح الرصيد." }, { status: 400 });
  }
}
