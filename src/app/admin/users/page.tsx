import { requirePlatformAdmin } from "@/lib/authz";
import { getAdminUsersData } from "@/lib/user-admin";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsersAdmin } from "@/components/admin/users-admin";

export default async function AdminUsersPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === "string" ? parseInt(searchParams.page, 10) : 1;

  const session = await requirePlatformAdmin();
  const data = await getAdminUsersData(session.user.tenantId, page, 20);

  return (
    <>
      <PageHeader
        title="User management"
        description="Manage tenant users, roles, active status, and role quotas from one place."
      />
      <UsersAdmin 
        users={data.users} 
        usage={data.usage} 
        limits={data.limits} 
        currentPage={data.pagination.currentPage} 
        totalPages={data.pagination.totalPages} 
      />
    </>
  );
}
