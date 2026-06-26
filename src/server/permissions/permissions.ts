export const permissions = {
  contactsRead: "contacts.read",
  contactsWrite: "contacts.write",
  contactsDelete: "contacts.delete",

  companiesRead: "companies.read",
  companiesWrite: "companies.write",
  companiesDelete: "companies.delete",

  inboxRead: "inbox.read",
  inboxReply: "inbox.reply",
  inboxAssign: "inbox.assign",
  inboxManage: "inbox.manage",

  ticketsRead: "tickets.read",
  ticketsManage: "tickets.manage",

  usersRead: "users.read",
  usersManage: "users.manage",

  teamsRead: "teams.read",
  teamsWrite: "teams.write",

  aiRead: "ai.read",
  aiManage: "ai.manage",

  knowledgeRead: "knowledge.read",
  knowledgeManage: "knowledge.manage",

  automationsRead: "automations.read",
  automationsManage: "automations.manage",

  reportsRead: "reports.read",

  billingRead: "billing.read",
  billingManage: "billing.manage",

  settingsRead: "settings.read",
  settingsManage: "settings.manage"
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

export const permissionValues = Object.values(permissions) as Permission[];

export const permissionModes = ["role", "custom", "full"] as const;
export type PermissionMode = (typeof permissionModes)[number];

export function isPermission(value: unknown): value is Permission {
  return typeof value === "string" && permissionValues.includes(value as Permission);
}

export function isPermissionMode(value: unknown): value is PermissionMode {
  return typeof value === "string" && permissionModes.includes(value as PermissionMode);
}
