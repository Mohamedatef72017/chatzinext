import { Types } from "mongoose";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { Tenant, TenantSubscription, User } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { type Permission } from "@/server/permissions/permissions";
import {
  getEffectivePermissionsFromRecord,
  getPermissionModeFromRecord,
  hasPermission,
} from "@/server/permissions/effective";
import { isRole, type Role } from "@/server/permissions/roles";

export async function requireSuperAdmin() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    throw new Error("Authentication is required.");
  }
  if (session.user.isSuperAdmin === true || session.user.role === "super-admin") {
    return session;
  }
  await connectToDatabase();
  const user = await User.findOne({ _id: session.user.id, isActive: true }).lean();
  if (!((user as any)?.isSuperAdmin === true || (user as any)?.role === "super-admin")) {
    throw new Error("Super-admin access is required.");
  }
  return session;
}

export async function requireAuth() {
  const session = await getCurrentSession();
  if (!session?.user?.id) {
    throw new Error("Authentication is required.");
  }
  return session;
}

export async function requireTenant() {
  const session = await requireAuth();
  if (!session.user.tenantId) {
    throw new Error("Tenant access is required.");
  }
  return session;
}

export async function requireActiveUser() {
  const session = await requireTenant();
  await connectToDatabase();

  const user = await User.findOne({
    _id: session.user.id,
    tenantId: session.user.tenantId,
    isActive: true
  }).lean();

  if (!user) {
    throw new Error("Active user access is required.");
  }

  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireActiveUser();
  await connectToDatabase();

  const user = await User.findOne({
    _id: session.user.id,
    tenantId: session.user.tenantId,
    isActive: true
  }).select("role isSuperAdmin permissionMode permissions").lean();

  if (!user) {
    throw new Error("Active user access is required.");
  }

  const effectivePermissions = getEffectivePermissionsFromRecord(user as any);
  if (!hasPermission(effectivePermissions, permission)) {
    throw new Error(`Permission required: ${permission}`);
  }

  session.user.permissionMode = getPermissionModeFromRecord(user as any);
  session.user.permissions = effectivePermissions;
  return session;
}

export async function requireDashboardPermission(permission: Permission) {
  try {
    return await requirePermission(permission);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isAccessError =
      message.startsWith("Permission required:") ||
      message.includes("Authentication is required") ||
      message.includes("Tenant access is required") ||
      message.includes("Active user access is required");

    if (!isAccessError) throw error;
    redirect(`/dashboard/unauthorized?permission=${encodeURIComponent(permission)}`);
  }
}

export async function requireRole(role: Role | Role[]) {
  const session = await requireActiveUser();
  const allowedRoles = Array.isArray(role) ? role : [role];

  if (!isRole(session.user.role) || !allowedRoles.includes(session.user.role)) {
    throw new Error(`Role required: ${allowedRoles.join(", ")}`);
  }

  return session;
}

export async function assertTenantAccess(modelTenantId: Types.ObjectId | string | null | undefined) {
  const session = await requireTenant();
  if (!modelTenantId || modelTenantId.toString() !== session.user.tenantId) {
    throw new Error("You cannot access a record from another tenant.");
  }
  return session;
}

export async function requireActiveSubscriptionIfNeeded(featureKey: string) {
  const session = await requireActiveUser();
  await connectToDatabase();

  const tenant = await Tenant.findOne({ _id: session.user.tenantId, isActive: true }).lean();
  if (!tenant) {
    throw new Error("Active tenant access is required.");
  }

  const subscription = await TenantSubscription.findOne({
    tenantId: session.user.tenantId,
    status: { $in: ["active", "trialing"] }
  }).lean();

  if (!subscription) {
    throw new Error(`An active subscription is required for ${featureKey}.`);
  }

  return session;
}
