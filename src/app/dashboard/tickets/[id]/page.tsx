import { notFound } from "next/navigation";
import { getTicketDetail } from "@/lib/dashboard-data";
import { PageHeader } from "@/components/dashboard/page-header";
import { TicketDetailClient } from "@/components/dashboard/ticket-detail-client";
import { requireDashboardPermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";
import { shouldScopeToAssignedTickets } from "@/server/permissions/effective";

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboardPermission(permissions.ticketsRead);
  const { id } = await params;
  const ticket = await getTicketDetail(session.user.tenantId, id, {
    userId: session.user.id,
    assignedOnly: shouldScopeToAssignedTickets(session.user.permissions),
  });
  if (!ticket) notFound();
  const canManageTickets = Boolean(session.user.permissions?.includes(permissions.ticketsManage));

  return (
    <>
      <PageHeader
        title={`تذكرة #${ticket.number}`}
        description={`${ticket.subject} · ${ticket.requesterExternalId}`}
      />
      <TicketDetailClient ticket={ticket} canManage={canManageTickets} />
    </>
  );
}
