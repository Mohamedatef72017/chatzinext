import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Tenant, User } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import {
  assertSupportAgentLimit,
  getSupportAgentsData,
  isSupportAgentRole,
  SUPPORT_AGENT_ROLES,
} from "@/lib/support-agents";
import { normalizePermissions } from "@/server/permissions/effective";
import { isPermissionMode, permissionModes } from "@/server/permissions/permissions";
import { requirePermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";

const createSupportAgentSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  password: z.string().min(12).max(128).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, "Password must include uppercase, lowercase, a number, and a symbol."),
  role: z.enum(SUPPORT_AGENT_ROLES),
  permissionMode: z.enum(permissionModes).optional(),
  permissions: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const session = await requirePermission(permissions.usersManage);
    const data = await getSupportAgentsData(session.user.tenantId);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load support agents.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission(permissions.usersManage);
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
    const existingUser = await User.findOne({ tenantId: tenant._id, email })
      .select("_id name email role isActive")
      .lean();
    if (existingUser) {
      const roleLabel =
        existingUser.role === "agent" ? "وكيل دعم" :
        existingUser.role === "manager" ? "مدير دعم" :
        existingUser.role === "admin" ? "مدير حساب" :
        existingUser.role === "owner" ? "مالك الحساب" :
        existingUser.role || "مستخدم";
      return NextResponse.json({
        error: `هذا البريد مستخدم بالفعل داخل نفس المستأجر كـ ${roleLabel}. لا يمكن إضافة مستخدمين بنفس البريد.`,
        existingUser: {
          id: existingUser._id.toString(),
          role: existingUser.role,
          isActive: existingUser.isActive !== false,
        },
      }, { status: 409 });
    }

    await assertSupportAgentLimit(tenant._id.toString(), body.role);
    const permissionMode = isPermissionMode(body.permissionMode) ? body.permissionMode : "role";

    const user = await User.create({
      name: body.name.trim(),
      email,
      password: await bcrypt.hash(body.password, 12),
      role: body.role,
      permissionMode,
      permissions: permissionMode === "custom" ? normalizePermissions(body.permissions || []) : [],
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
