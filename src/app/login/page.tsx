import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await getCurrentSession();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,#f7f2ff_0%,#ffffff_52%,#eef2ff_100%)] p-4 dark:bg-[radial-gradient(circle_at_top,#12061f_0%,#0b0418_56%,#06030e_100%)]">
      <div className="absolute -start-24 top-16 h-72 w-72 rounded-full bg-[#6119E6]/10 blur-3xl dark:bg-[#E13382]/10" />
      <div className="absolute -end-20 bottom-10 h-80 w-80 rounded-full bg-[#E13382]/10 blur-3xl dark:bg-[#6119E6]/10" />
      <div className="relative z-10 w-full max-w-[560px]">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
