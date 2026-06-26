import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { User } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import {
  assertSupportAgentLimit,
  isSupportAgentRole,
  SUPPORT_AGENT_ROLES,
} from "@/lib/support-agents";

const updateSupportAgentSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(SUPPORT_AGENT_ROLES).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    const body = updateSupportAgentSchema.parse(await request.json());
    await connectToDatabase();

    const target = await User.findOne({ _id: id, tenantId: session.user.tenantId });
    if (!target || !isSupportAgentRole(target.role)) {
      return NextResponse.json({ error: "Support agent was not found." }, { status: 404 });
    }

    if (body.role && body.role !== target.role) {
      await assertSupportAgentLimit(session.user.tenantId, body.role);
      target.role = body.role;
    }

    if (typeof body.isActive === "boolean") {
      target.isActive = body.isActive;
    }

    await target.save();
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update support agent.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin();
    const { id } = await params;
    await connectToDatabase();

    const target = await User.findOne({ _id: id, tenantId: session.user.tenantId });
    if (!target || !isSupportAgentRole(target.role)) {
      return NextResponse.json({ error: "Support agent was not found." }, { status: 404 });
    }

    await User.deleteOne({ _id: target._id, tenantId: session.user.tenantId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete support agent.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
