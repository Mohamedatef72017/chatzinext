import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SignOutButton } from "@/components/dashboard/sign-out";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { NotificationsMenu } from "@/components/dashboard/notifications-menu";
import { ProfileDropdown } from "@/components/dashboard/profile-dropdown";
import { RealtimeBridge } from "@/components/dashboard/realtime-bridge";
import { getBillingCatalog } from "@/lib/billing";
import { BillingProvider } from "@/components/providers/billing-provider";
import { getEffectivePermissionsForUser } from "@/server/permissions/effective";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session?.user?.tenantId) redirect("/login");

  const [catalog, effectivePermissions] = await Promise.all([
    getBillingCatalog(session.user.tenantId),
    getEffectivePermissionsForUser(session.user.id, session.user.tenantId),
  ]);

  return (
    <BillingProvider initialData={catalog}>
      <div className="dashboard-shell theme-rescue flex h-[100dvh] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-[#0B0C1E] dark:to-[#12132A] p-0 transition-colors duration-200">
        <div className="flex flex-1 overflow-hidden bg-transparent relative w-full transition-colors duration-200">
          <Sidebar permissions={effectivePermissions} />
          <div className="flex flex-1 flex-col min-w-0 bg-transparent relative z-10 transition-colors duration-200 p-2 rtl:pl-0 ltr:pr-0 xl:p-4 xl:rtl:pl-4 xl:ltr:pr-4">
            
            {/* Transparent structural container */}
            <div className="flex flex-1 flex-col overflow-hidden relative transition-colors duration-200">
              <header className="safe-top sticky top-0 z-20 transition-colors duration-200">
                <div className="flex min-h-16 items-center justify-between gap-3 px-4 py-2 rtl:pl-16 ltr:pr-16 lg:px-4">
                  <div className="min-w-0 flex-1">
                    {/* Empty left side of header, or could put breadcrumbs here */}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 sm:gap-4">
                    <div className="hidden lg:block">
                      <NotificationsMenu />
                    </div>
                    <ThemeToggle />
                    <ProfileDropdown name={session.user.name || "User"} email={session.user.email || ""} />
                  </div>
                </div>
              </header>
              <main className="pb-mobile-nav flex-1 overflow-y-auto lg:px-4 relative z-10">
              {children}
              <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-slate-200 py-5 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row transition-colors duration-200">
                <span>© {new Date().getFullYear()} ChatZi CRM. All rights reserved.</span>
                <a href="/dashboard/complaints" className="font-semibold text-indigo-600 transition hover:text-indigo-700 dark:text-indigo-400">
                  صفحة الشكاوي والدعم
                </a>
              </footer>
              </main>
            </div>
            <RealtimeBridge />
          </div>
        </div>
      </div>
    </BillingProvider>
  );
}
