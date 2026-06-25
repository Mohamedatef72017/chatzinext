import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/server/auth/guards";
import { SubscriptionHistory } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    await requireSuperAdmin();
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50", 10));

    await connectToDatabase();

    const filter: Record<string, unknown> = {};
    if (tenantId) filter.tenantId = tenantId;

    const [history, total] = await Promise.all([
      SubscriptionHistory.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SubscriptionHistory.countDocuments(filter)
    ]);

    return NextResponse.json({ history, total, page, limit });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 400 });
  }
}
