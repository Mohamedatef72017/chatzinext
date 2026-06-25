import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";

export async function appendSubscriptionHistory(params: {
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
    await connectToDatabase();
    const { SubscriptionHistory } = await import("@/lib/models");
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
