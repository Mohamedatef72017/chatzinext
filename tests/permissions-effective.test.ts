import {
  canAccessAllInbox,
  canAccessAllTickets,
  getEffectivePermissionsFromRecord,
} from "@/server/permissions/effective";
import { permissions } from "@/server/permissions/permissions";

describe("effective user permissions", () => {
  it("keeps default support agents scoped to assigned inbox and tickets", () => {
    const effective = getEffectivePermissionsFromRecord({ role: "agent" });

    expect(effective).toContain(permissions.inboxRead);
    expect(effective).toContain(permissions.inboxReply);
    expect(effective).toContain(permissions.ticketsRead);
    expect(canAccessAllInbox(effective)).toBe(false);
    expect(canAccessAllTickets(effective)).toBe(false);
  });

  it("grants every permission for full control users", () => {
    const effective = getEffectivePermissionsFromRecord({ role: "agent", permissionMode: "full" });

    expect(effective).toContain(permissions.usersManage);
    expect(effective).toContain(permissions.billingManage);
    expect(canAccessAllInbox(effective)).toBe(true);
    expect(canAccessAllTickets(effective)).toBe(true);
  });

  it("uses only selected permissions for custom users", () => {
    const effective = getEffectivePermissionsFromRecord({
      role: "manager",
      permissionMode: "custom",
      permissions: [permissions.inboxRead, permissions.ticketsRead],
    });

    expect(effective).toEqual([permissions.inboxRead, permissions.ticketsRead]);
    expect(effective).not.toContain(permissions.inboxManage);
  });
});
