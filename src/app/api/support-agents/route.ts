import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/authz";
import { Tenant, User } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import {
  assertSupportAgentLimit,
  getSupportAgentsData,
  isSupportAgentRole,
  SUPPORT_AGENT_ROLES,
} from "@/lib/support-agents";

const createSupportAgentSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  password: z.string().min(12).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, "Password must include uppercase, lowercase, and a number."),
  role: z.enum(SUPPORT_AGENT_ROLES),
});

export async function GET() {
  try {
    const session = await requireAdmin();
    const data = await getSupportAgentsData(session.user.tenantId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load support agents.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireAdmin();
    const body = createSupportAgentSchema.parse(await request.json());
    await connectToDatabase();

    if (!isSupportAgentRole(body.role)) {
      return NextResponse.json({ error: "Unsupported support team role." }, { status: 400 });
    }

    const tenant = await Tenant.findOne({ _id: session.user.tenantId, isActive: true });
    if (!tenant) {
      return NextResponse.json({ error: "Tenant was not found or is inactive." }, { status: 404 });
    }

    const email = body.email.toLowerCase().trim();
    const exists = await User.exists({ tenantId: tenant._id, email });
    if (exists) {
      return NextResponse.json({ error: "Email is already used in this tenant." }, { status: 409 });
    }

    await assertSupportAgentLimit(tenant._id.toString(), body.role);

    const user = await User.create({
      name: body.name.trim(),
      email,
      password: await bcrypt.hash(body.password, 12),
      role: body.role,
      tenantId: tenant._id,
      ownerId: tenant.ownerId,
      isActive: true,
    });

    return NextResponse.json({ id: user._id.toString() }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add support agent.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
