"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ShieldCheck, Trash2, UserRoundPlus, UsersRound } from "lucide-react";
import type { SupportAgentRole } from "@/lib/support-agents";

type SupportAgentUser = {
  id: string;
  name: string;
  email: string;
  role: SupportAgentRole;
  isActive: boolean;
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

export function SupportAgentsManager({ users, usage, limits, isAr }: SupportAgentsManagerProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState("");

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
  };

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      password: String(form.get("password") || ""),
      role: String(form.get("role") || "agent"),
    };

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

    event.currentTarget.reset();
    setSuccess(labels.added);
    router.refresh();
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
      return;
    }
    setSuccess(labels.updated);
    router.refresh();
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
          <Field name="password" label={labels.password} type="password" minLength={12} required />
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

        <button className="btn-primary mt-5">
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
                <th className="p-3 text-right">{labels.status}</th>
                <th className="p-3 text-right">{labels.createdAt}</th>
                <th className="p-3 text-right">{labels.actions}</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? users.map((user) => (
                <tr key={user.id} className="border-t border-slate-100 dark:border-slate-800">
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
              )) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-slate-500">{labels.empty}</td>
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
