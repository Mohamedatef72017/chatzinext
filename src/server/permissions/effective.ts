import { User } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import {
  isPermission,
  isPermissionMode,
  permissions,
  permissionValues,
  type Permission,
  type PermissionMode,
} from "@/server/permissions/permissions";
import { rolePermissions, type Role } from "@/server/permissions/roles";

export type PermissionUserRecord = {
  role?: Role | string | null;
  isSuperAdmin?: boolean | null;
  permissionMode?: PermissionMode | string | null;
  permissions?: unknown;
};

export const allPermissions = permissionValues;

export function normalizePermissions(values: unknown): Permission[] {
  if (!Array.isArray(values)) return [];
  return Array.from(new Set(values.filter(isPermission)));
}

export function hasPermission(effectivePermissions: readonly Permission[] | undefined, permission: Permission) {
  return Boolean(effectivePermissions?.includes(permission));
}

export function getEffectivePermissionsFromRecord(user: PermissionUserRecord): Permission[] {
  if (user.isSuperAdmin === true || user.role === "super-admin" || user.role === "owner" || user.role === "admin") {
    return [...allPermissions];
  }

  if (user.permissionMode === "full") {
    return [...allPermissions];
  }

  if (user.permissionMode === "custom") {
    return normalizePermissions(user.permissions);
  }

  const role = user.role as Role;
  return [...(rolePermissions[role] || [])];
}

export function getPermissionModeFromRecord(user: PermissionUserRecord): PermissionMode {
  return isPermissionMode(user.permissionMode) ? user.permissionMode : "role";
}

export async function getEffectivePermissionsForUser(userId: string, tenantId?: string) {
  await connectToDatabase();
  const query: Record<string, unknown> = { _id: userId, isActive: true };
  if (tenantId) query.tenantId = tenantId;

  const user = await User.findOne(query)
    .select("role isSuperAdmin permissionMode permissions")
    .lean();

  if (!user) return [];
  return getEffectivePermissionsFromRecord(user as PermissionUserRecord);
}

export function canAccessAllInbox(effectivePermissions: readonly Permission[] | undefined) {
  return hasPermission(effectivePermissions, permissions.inboxManage) || hasPermission(effectivePermissions, permissions.inboxAssign);
}

export function shouldScopeToAssignedConversations(effectivePermissions: readonly Permission[] | undefined) {
  return !canAccessAllInbox(effectivePermissions);
}

export function canAccessAllTickets(effectivePermissions: readonly Permission[] | undefined) {
  return hasPermission(effectivePermissions, permissions.ticketsManage);
}

export function shouldScopeToAssignedTickets(effectivePermissions: readonly Permission[] | undefined) {
  return !canAccessAllTickets(effectivePermissions);
}
