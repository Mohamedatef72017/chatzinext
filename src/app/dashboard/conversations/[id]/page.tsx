import { notFound } from "next/navigation";
import Link from "next/link";
import { getConversationDetail } from "@/lib/dashboard-data";
import { PageHeader } from "@/components/dashboard/page-header";
import { ConversationViewer } from "@/components/dashboard/conversation-viewer";
import { requireDashboardPermission } from "@/server/auth/guards";
import { permissions } from "@/server/permissions/permissions";
import { shouldScopeToAssignedConversations } from "@/server/permissions/effective";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireDashboardPermission(permissions.inboxRead);
  const { id } = await params;
  const conversation = await getConversationDetail(session.user.tenantId, id, {
    userId: session.user.id,
    assignedOnly: shouldScopeToAssignedConversations(session.user.permissions),
  });
  if (!conversation) notFound();

  return (
    <>
      <PageHeader
        title={`محادثة ${conversation.externalUserId}`}
        description={`${conversation.botName} · ${conversation.channel}`}
        action={
          conversation.ticket ? (
            <Link className="btn-secondary" href={`/dashboard/tickets/${conversation.ticket.id}`}>
              تذكرة #{conversation.ticket.number}
            </Link>
          ) : null
        }
      />
      <section className="max-w-4xl pt-4">
        <ConversationViewer
          conversationId={conversation.id}
          initialStatus={conversation.status}
          initialMessages={conversation.messages}
          botName={conversation.botName}
        />
      </section>
    </>
  );
}
