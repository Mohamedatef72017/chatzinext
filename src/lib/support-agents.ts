import { User } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { TENANT_USER_LIMITS } from "@/lib/user-admin";
import {
  getEffectivePermissionsFromRecord,
  getPermissionModeFromRecord,
} from "@/server/permissions/effective";

export const SUPPORT_AGENT_ROLES = ["manager", "agent"] as const;
export type SupportAgentRole = (typeof SUPPORT_AGENT_ROLES)[number];

export const SUPPORT_AGENT_LIMITS: Record<SupportAgentRole, number> = {
  manager: TENANT_USER_LIMITS.manager,
  agent: TENANT_USER_LIMITS.agent,
};

export function isSupportAgentRole(value: unknown): value is SupportAgentRole {
  return SUPPORT_AGENT_ROLES.includes(value as SupportAgentRole);
}

export async function getSupportAgentsData(tenantId: string) {
  await connectToDatabase();

  const [users, managerCount, agentCount] = await Promise.all([
    User.find({ tenantId, role: { $in: SUPPORT_AGENT_ROLES } })
      .select("_id name email role isActive lastLoginAt createdAt updatedAt permissionMode permissions isSuperAdmin")
      .sort({ role: 1, createdAt: -1 })
      .lean(),
    User.countDocuments({ tenantId, role: "manager" }),
    User.countDocuments({ tenantId, role: "agent" }),
  ]);

  return {
    limits: SUPPORT_AGENT_LIMITS,
    usage: {
      manager: managerCount,
      agent: agentCount,
    },
    users: users.map((user: any) => ({
      id: user._id.toString(),
      name: user.name || "",
      email: user.email || "",
      role: user.role as SupportAgentRole,
      isActive: user.isActive !== false,
      permissionMode: getPermissionModeFromRecord(user),
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
      effectivePermissions: getEffectivePermissionsFromRecord(user),
      lastLoginAt: user.lastLoginAt?.toISOString?.() || "",
      createdAt: user.createdAt?.toISOString?.() || "",
    })),
  };
}

export async function assertSupportAgentLimit(tenantId: string, role: SupportAgentRole) {
  const count = await User.countDocuments({ tenantId, role });
  const limit = SUPPORT_AGENT_LIMITS[role];
  if (count >= limit) {
    throw new Error(role === "manager" ? "تم الوصول إلى حد المديرين لهذا المستأجر." : "تم الوصول إلى حد وكلاء الدعم لهذا المستأجر.");
  }
}
