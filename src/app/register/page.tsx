import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const session = await getCurrentSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-950">
      <RegisterForm />
    </main>
  );
}
