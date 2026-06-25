/**
 * billing-audit.ts
 *
 * Records every admin action that touches billing state.
 * All writes are append-only — no updates, no deletes.
 */

import { connectToDatabase } from "@/lib/mongodb";
import { BillingAuditLog } from "@/lib/models";

export interface AuditEntry {
  actorId: string;
  actorEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  note?: string;
}

export async function writeBillingAudit(entry: AuditEntry): Promise<void> {
  try {
    await connectToDatabase();
    await BillingAuditLog.create({
      actorId: entry.actorId,
      actorEmail: entry.actorEmail ?? "",
      action: entry.action,
      targetType: entry.targetType ?? "",
      targetId: entry.targetId ?? "",
      before: entry.before ?? null,
      after: entry.after ?? null,
      ipAddress: entry.ipAddress ?? "",
      note: entry.note ?? ""
    });
  } catch (err) {
    // Audit log failure must never block the main operation
    console.error("[billing-audit] Failed to write audit log:", err);
  }
}
