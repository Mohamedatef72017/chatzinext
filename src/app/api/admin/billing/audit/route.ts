import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/server/auth/guards";
import { BillingAuditLog } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));
    const action = searchParams.get("action") ?? "";
    const targetId = searchParams.get("targetId") ?? "";

    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (action) filter.action = action;
    if (targetId) filter.targetId = targetId;

    const [logs, total] = await Promise.all([
      BillingAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      BillingAuditLog.countDocuments(filter)
    ]);

    return NextResponse.json({ logs, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}
