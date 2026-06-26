"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, Save, ShieldCheck, Trash2, UserRoundPlus, UsersRound } from "lucide-react";
import type { SupportAgentRole } from "@/lib/support-agents";
import { permissions } from "@/server/permissions/permissions";
import type { Permission, PermissionMode } from "@/server/permissions/permissions";

type SupportAgentUser = {
  id: string;
  name: string;
  email: string;
  role: SupportAgentRole;
  isActive: boolean;
  permissionMode: PermissionMode;
  permissions: Permission[];
  effectivePermissions: Permission[];
  lastLoginAt: string;
  createdAt: string;
};

type SupportAgentsManagerProps = {
  users: SupportAgentUser[];
  usage: Record<SupportAgentRole, number>;
  limits: Record<SupportAgentRole, number>;
  isAr: boolean;
};

const roles: Array<{ value: SupportAgentRole; labelAr: string; labelEn: string }> = [
  { value: "agent", labelAr: "وكيل دعم", labelEn: "Support agent" },
  { value: "manager", labelAr: "مدير دعم", labelEn: "Support manager" },
];

const permissionOptions: Array<{ value: Permission; labelAr: string; labelEn: string; helperAr: string; helperEn: string }> = [
  { value: permissions.inboxRead, labelAr: "قراءة المحادثات", labelEn: "Read conversations", helperAr: "الوكيل يرى المسند له فقط بدون إدارة.", helperEn: "Assigned-only unless manage access is granted." },
  { value: permissions.inboxReply, labelAr: "الرد على المحادثات", labelEn: "Reply to conversations", helperAr: "إرسال ردود على المحادثات المسموحة.", helperEn: "Send replies in allowed conversations." },
  { value: permissions.inboxAssign, labelAr: "إسناد المحادثات", labelEn: "Assign conversations", helperAr: "إسناد المحادثات للوكلاء والفرق.", helperEn: "Assign conversations to agents and teams." },
  { value: permissions.inboxManage, labelAr: "إدارة كل المحادثات", labelEn: "Manage all conversations", helperAr: "يفتح عرض كل المحادثات.", helperEn: "Allows viewing and managing all conversations." },
  { value: permissions.ticketsRead, labelAr: "قراءة التذاكر", labelEn: "Read tickets", helperAr: "الوكيل يرى تذاكر محادثاته فقط.", helperEn: "Assigned-only unless manage access is granted." },
  { value: permissions.ticketsManage, labelAr: "إدارة كل التذاكر", labelEn: "Manage all tickets", helperAr: "عرض وتعديل كل التذاكر.", helperEn: "View and update all tickets." },
  { value: permissions.contactsRead, labelAr: "قراءة جهات الاتصال", labelEn: "Read contacts", helperAr: "عرض بيانات العملاء.", helperEn: "View customer records." },
  { value: permissions.contactsWrite, labelAr: "تعديل جهات الاتصال", labelEn: "Edit contacts", helperAr: "إنشاء وتحديث العملاء.", helperEn: "Create and update contacts." },
  { value: permissions.knowledgeRead, labelAr: "قراءة قاعدة المعرفة", labelEn: "Read knowledge base", helperAr: "عرض مصادر المعرفة.", helperEn: "View knowledge sources." },
  { value: permissions.knowledgeManage, labelAr: "إدارة قاعدة المعرفة", labelEn: "Manage knowledge base", helperAr: "تعديل وتدريب مصادر المعرفة.", helperEn: "Edit and retrain knowledge sources." },
  { value: permissions.aiRead, labelAr: "قراءة أدوات الذكاء", labelEn: "Read AI tools", helperAr: "اقتراحات ومراجعة AI.", helperEn: "AI suggestions and review tools." },
  { value: permissions.aiManage, labelAr: "إدارة إعدادات الذكاء", labelEn: "Manage AI settings", helperAr: "تغيير مزودات وإعدادات AI.", helperEn: "Change AI providers and settings." },
  { value: permissions.usersManage, labelAr: "إدارة المستخدمين", labelEn: "Manage users", helperAr: "إضافة وتعديل وكلاء ومديرين.", helperEn: "Add and edit agents and managers." },
  { value: permissions.settingsManage, labelAr: "إدارة الإعدادات والقنوات", labelEn: "Manage settings and channels", helperAr: "تغيير إعدادات الحساب والقنوات.", helperEn: "Change workspace and channel settings." },
  { value: permissions.reportsRead, labelAr: "قراءة التقارير", labelEn: "Read reports", helperAr: "عرض الإحصائيات والتقارير.", helperEn: "View analytics and reports." },
  { value: permissions.billingManage, labelAr: "إدارة الفوترة", labelEn: "Manage billing", helperAr: "الوصول للفواتير والاشتراكات.", helperEn: "Access billing and subscription controls." },
];

const defaultCustomPermissions: Permission[] = [
  permissions.inboxRead,
  permissions.inboxReply,
  permissions.ticketsRead,
  permissions.contactsRead,
];

export function SupportAgentsManager({ users, usage, limits, isAr }: SupportAgentsManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState("");
  const [creating, setCreating] = useState(false);
  const [password, setPassword] = useState("");
  const [formPermissionMode, setFormPermissionMode] = useState<PermissionMode>("role");
  const [formPermissions, setFormPermissions] = useState<Permission[]>(defaultCustomPermissions);
  const [permissionEditorId, setPermissionEditorId] = useState("");
  const [permissionDrafts, setPermissionDrafts] = useState<Record<string, { permissionMode: PermissionMode; permissions: Permission[] }>>({});

  const labels = {
    addTitle: isAr ? "إضافة عضو لفريق الدعم" : "Add support team member",
    name: isAr ? "الاسم" : "Name",
    email: isAr ? "البريد الإلكتروني" : "Email",
    password: isAr ? "كلمة المرور" : "Password",
    role: isAr ? "الدور" : "Role",
    save: isAr ? "إضافة العضو" : "Add member",
    active: isAr ? "نشط" : "Active",
    inactive: isAr ? "معطل" : "Inactive",
    actions: isAr ? "الإجراءات" : "Actions",
    status: isAr ? "الحالة" : "Status",
    createdAt: isAr ? "تاريخ الإضافة" : "Created",
    empty: isAr ? "لم يتم إضافة وكلاء دعم بعد." : "No support agents yet.",
    deactivate: isAr ? "تعطيل" : "Deactivate",
    activate: isAr ? "تفعيل" : "Activate",
    delete: isAr ? "حذف" : "Delete",
    confirmDelete: isAr ? "هل تريد حذف هذا العضو من فريق الدعم؟" : "Delete this support team member?",
    added: isAr ? "تم إضافة العضو بنجاح." : "Support team member added.",
    updated: isAr ? "تم تحديث العضو." : "Member updated.",
    deleted: isAr ? "تم حذف العضو." : "Member deleted.",
    permissions: isAr ? "الصلاحيات" : "Permissions",
    roleDefaults: isAr ? "صلاحيات الدور الافتراضية" : "Role defaults",
    customPermissions: isAr ? "صلاحيات مخصصة" : "Custom permissions",
    fullControl: isAr ? "تحكم كامل" : "Full control",
    editPermissions: isAr ? "تعديل الصلاحيات" : "Edit permissions",
    savePermissions: isAr ? "حفظ الصلاحيات" : "Save permissions",
    fullControlWarning: isAr
      ? "تحذير: التحكم الكامل يمنح هذا المستخدم كل إمكانيات الحساب، بما فيها المحادثات والتذاكر والإعدادات والمستخدمين والفوترة."
      : "Warning: full control grants every workspace capability, including conversations, tickets, settings, users, and billing.",
  };

  const passwordChecks = [
    { ok: password.length >= 12, label: isAr ? "12 حرفًا على الأقل" : "At least 12 characters" },
    { ok: /[a-z]/.test(password), label: isAr ? "حرف صغير" : "Lowercase letter" },
    { ok: /[A-Z]/.test(password), label: isAr ? "حرف كبير" : "Uppercase letter" },
    { ok: /\d/.test(password), label: isAr ? "رقم" : "Number" },
    { ok: /[^A-Za-z0-9]/.test(password), label: isAr ? "رمز خاص" : "Symbol" },
  ];
  const isPasswordStrong = passwordChecks.every((check) => check.ok);

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      role: String(form.get("role") || "agent"),
      permissionMode: formPermissionMode,
      permissions: formPermissionMode === "custom" ? formPermissions : [],
    };

    if (!isPasswordStrong) {
      setError(isAr ? "كلمة المرور يجب أن تكون مركبة وتستوفي كل الشروط." : "Password must meet all complexity rules.");
      return;
    }

    if (formPermissionMode === "full" && !confirm(labels.fullControlWarning)) {
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/support-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body.error || "Unable to add support agent.");
        return;
      }

      formElement.reset();
      setPassword("");
      setFormPermissionMode("role");
      setFormPermissions(defaultCustomPermissions);
      setSuccess(labels.added);
      router.refresh();
    } finally {
      setCreating(false);
    }
  }

  async function updateUser(id: string, payload: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    setSuccess("");
    const response = await fetch(`/api/support-agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    setBusyId("");
    if (!response.ok) {
      setError(body.error || "Unable to update support agent.");
      return false;
    }
    setSuccess(labels.updated);
    router.refresh();
    return true;
  }

  async function deleteUser(id: string) {
    if (!confirm(labels.confirmDelete)) return;
    setBusyId(id);
    setError("");
    setSuccess("");
    const response = await fetch(`/api/support-agents/${id}`, { method: "DELETE" });
    const body = await response.json();
    setBusyId("");
    if (!response.ok) {
      setError(body.error || "Unable to delete support agent.");
      return;
    }
    setSuccess(labels.deleted);
    router.refresh();
  }

  function toggleFormPermission(permission: Permission) {
    setFormPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission]
    );
  }

  function openPermissionEditor(user: SupportAgentUser) {
    setPermissionEditorId((current) => current === user.id ? "" : user.id);
    setPermissionDrafts((current) => ({
      ...current,
      [user.id]: {
        permissionMode: current[user.id]?.permissionMode || user.permissionMode || "role",
        permissions: current[user.id]?.permissions || user.permissions || [],
      },
    }));
  }

  function updateDraft(userId: string, next: Partial<{ permissionMode: PermissionMode; permissions: Permission[] }>) {
    setPermissionDrafts((current) => ({
      ...current,
      [userId]: {
        permissionMode: current[userId]?.permissionMode || "role",
        permissions: current[userId]?.permissions || [],
        ...next,
      },
    }));
  }

  function toggleDraftPermission(userId: string, permission: Permission) {
    const current = permissionDrafts[userId]?.permissions || [];
    updateDraft(userId, {
      permissions: current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    });
  }

  async function saveUserPermissions(user: SupportAgentUser) {
    const draft = permissionDrafts[user.id] || { permissionMode: user.permissionMode, permissions: user.permissions };
    if (draft.permissionMode === "full" && !confirm(labels.fullControlWarning)) return;
    const ok = await updateUser(user.id, {
      permissionMode: draft.permissionMode,
      permissions: draft.permissionMode === "custom" ? draft.permissions : [],
    });
    if (ok) setPermissionEditorId("");
  }

  function modeLabel(mode: PermissionMode) {
    if (mode === "full") return labels.fullControl;
    if (mode === "custom") return labels.customPermissions;
    return labels.roleDefaults;
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2">
        <QuotaCard
          icon={UsersRound}
          title={isAr ? "وكلاء الدعم" : "Support agents"}
          used={usage.agent}
          limit={limits.agent}
          helper={isAr ? "الحد الأقصى لكل مستأجر" : "Maximum per tenant"}
        />
        <QuotaCard
          icon={ShieldCheck}
          title={isAr ? "مديرو الدعم" : "Support managers"}
          used={usage.manager}
          limit={limits.manager}
          helper={isAr ? "مديرون بصلاحيات إشراف" : "Managers with supervision access"}
        />
      </section>

      <form onSubmit={submitForm} className="panel p-5">
        <div className="mb-5 flex items-center gap-2">
          <UserRoundPlus size={18} className="text-accent" aria-hidden="true" />
          <h2 className="text-lg font-bold text-ink">{labels.addTitle}</h2>
        </div>

        {error ? <p className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
        {success ? <p className="mb-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{success}</p> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field name="name" label={labels.name} required />
          <Field name="email" label={labels.email} type="email" required />
          <div>
            <label className="label">{labels.password}</label>
            <input
              className="field"
              name="password"
              type="password"
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {password ? (
              <div className="mt-2 grid gap-1 text-xs">
                {passwordChecks.map((check) => (
                  <span key={check.label} className={`flex items-center gap-1.5 ${check.ok ? "text-emerald-700 dark:text-emerald-300" : "text-slate-500"}`}>
                    <CheckCircle2 size={13} aria-hidden="true" />
                    {check.label}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div>
            <label className="label">{labels.role}</label>
            <select className="field" name="role" defaultValue="agent">
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {isAr ? role.labelAr : role.labelEn}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
          <label className="label">{labels.permissions}</label>
          <div className="grid gap-2 md:grid-cols-3">
            {(["role", "custom", "full"] as PermissionMode[]).map((mode) => (
              <label key={mode} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${formPermissionMode === mode ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/30 dark:text-indigo-100" : "border-slate-200 dark:border-slate-800"}`}>
                <input
                  type="radio"
                  name="permissionMode"
                  value={mode}
                  checked={formPermissionMode === mode}
                  onChange={() => setFormPermissionMode(mode)}
                />
                <span className="font-bold">{modeLabel(mode)}</span>
              </label>
            ))}
          </div>

          {formPermissionMode === "full" ? (
            <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              {labels.fullControlWarning}
            </p>
          ) : null}

          {formPermissionMode === "custom" ? (
            <PermissionChecklist
              options={permissionOptions}
              selected={formPermissions}
              isAr={isAr}
              onToggle={toggleFormPermission}
            />
          ) : null}
        </div>

        <button className="btn-primary mt-5 disabled:cursor-not-allowed disabled:opacity-60" disabled={!isPasswordStrong || creating}>
          <Save size={18} aria-hidden="true" />
          {labels.save}
        </button>
      </form>

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <tr>
                <th className="p-3 text-right">{labels.name}</th>
                <th className="p-3 text-right">{labels.email}</th>
                <th className="p-3 text-right">{labels.role}</th>
                <th className="p-3 text-right">{labels.permissions}</th>
                <th className="p-3 text-right">{labels.status}</th>
                <th className="p-3 text-right">{labels.createdAt}</th>
                <th className="p-3 text-right">{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? users.map((user) => {
                const draft = permissionDrafts[user.id] || { permissionMode: user.permissionMode, permissions: user.permissions };
                return (
                  <Fragment key={user.id}>
                    <tr className="border-t border-slate-100 dark:border-slate-800">
                      <td className="p-3 font-semibold text-ink">{user.name}</td>
                      <td className="p-3" dir="ltr">{user.email}</td>
                      <td className="p-3">
                        <select
                          className="field max-w-44 py-1.5 text-xs"
                          value={user.role}
                          disabled={busyId === user.id}
                          onChange={(event) => updateUser(user.id, { role: event.target.value })}
                        >
                          {roles.map((role) => (
                            <option key={role.value} value={role.value}>
                              {isAr ? role.labelAr : role.labelEn}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1.5">
                          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${user.permissionMode === "full" ? "bg-amber-50 text-amber-800" : user.permissionMode === "custom" ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-600"}`}>
                            {modeLabel(user.permissionMode)}
                          </span>
                          <button className="text-xs font-bold text-indigo-600 hover:text-indigo-800" type="button" onClick={() => openPermissionEditor(user)}>
                            {labels.editPermissions}
                          </button>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${user.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {user.isActive ? labels.active : labels.inactive}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{formatDate(user.createdAt)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button className="btn-secondary px-3 py-1.5 text-xs" disabled={busyId === user.id} onClick={() => updateUser(user.id, { isActive: !user.isActive })}>
                            {user.isActive ? labels.deactivate : labels.activate}
                          </button>
                          <button className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/30" disabled={busyId === user.id} onClick={() => deleteUser(user.id)} title={labels.delete}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {permissionEditorId === user.id ? (
                      <tr className="border-t border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40">
                        <td colSpan={7} className="p-4">
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                            <div className="grid gap-2 md:grid-cols-3">
                              {(["role", "custom", "full"] as PermissionMode[]).map((mode) => (
                                <label key={mode} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm ${draft.permissionMode === mode ? "border-indigo-500 bg-indigo-50 text-indigo-900 dark:border-indigo-400 dark:bg-indigo-950/30 dark:text-indigo-100" : "border-slate-200 dark:border-slate-800"}`}>
                                  <input
                                    type="radio"
                                    checked={draft.permissionMode === mode}
                                    onChange={() => updateDraft(user.id, { permissionMode: mode })}
                                  />
                                  <span className="font-bold">{modeLabel(mode)}</span>
                                </label>
                              ))}
                            </div>

                            {draft.permissionMode === "full" ? (
                              <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                                <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                                {labels.fullControlWarning}
                              </p>
                            ) : null}

                            {draft.permissionMode === "custom" ? (
                              <PermissionChecklist
                                options={permissionOptions}
                                selected={draft.permissions}
                                isAr={isAr}
                                onToggle={(permission) => toggleDraftPermission(user.id, permission)}
                              />
                            ) : null}

                            <button className="btn-primary mt-4" type="button" disabled={busyId === user.id} onClick={() => saveUserPermissions(user)}>
                              <Save size={16} aria-hidden="true" />
                              {labels.savePermissions}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              }) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-slate-500">{labels.empty}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="label">{label}</label>
      <input className="field" {...rest} />
    </div>
  );
}

function PermissionChecklist({
  options,
  selected,
  isAr,
  onToggle,
}: {
  options: Array<{ value: Permission; labelAr: string; labelEn: string; helperAr: string; helperEn: string }>;
  selected: Permission[];
  isAr: boolean;
  onToggle: (permission: Permission) => void;
}) {
  return (
    <div className="mt-4 grid gap-2 md:grid-cols-2">
      {options.map((option) => (
        <label key={option.value} className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-3 text-sm transition hover:border-indigo-300 dark:border-slate-800">
          <input
            className="mt-1"
            type="checkbox"
            checked={selected.includes(option.value)}
            onChange={() => onToggle(option.value)}
          />
          <span>
            <span className="block font-bold text-ink">{isAr ? option.labelAr : option.labelEn}</span>
            <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
              {isAr ? option.helperAr : option.helperEn}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}

function QuotaCard({
  icon: Icon,
  title,
  used,
  limit,
  helper,
}: {
  icon: typeof UsersRound;
  title: string;
  used: number;
  limit: number;
  helper: string;
}) {
  const ratio = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <article className="panel p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-3xl font-black text-ink">{used} / {limit}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          <Icon size={21} />
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${ratio}%` }} />
      </div>
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{helper}</p>
    </article>
  );
}

function formatDate(value: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}
