import type { DefaultSession } from "next-auth";
import type { Permission, PermissionMode } from "@/server/permissions/permissions";
import type { Role } from "@/server/permissions/roles";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      tenantId: string;
      isActive: boolean;
      isSuperAdmin: boolean;
      permissionMode?: PermissionMode;
      permissions?: Permission[];
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    tenantId: string;
    isActive: boolean;
    isSuperAdmin: boolean;
    permissionMode?: PermissionMode;
    permissions?: Permission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    tenantId: string;
    isActive: boolean;
    isSuperAdmin: boolean;
    permissionMode?: PermissionMode;
    permissions?: Permission[];
  }
}
