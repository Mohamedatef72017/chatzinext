import { NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import { Conversation, Ticket, Lead } from "@/lib/models";
import { requireTenant } from "@/server/auth/guards";
import {
  getEffectivePermissionsForUser,
  hasPermission,
  shouldScopeToAssignedConversations,
  shouldScopeToAssignedTickets,
} from "@/server/permissions/effective";
import { permissions } from "@/server/permissions/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await requireTenant();
    await connectToDatabase();

    const tenantId = session.user.tenantId;
    const effectivePermissions = await getEffectivePermissionsForUser(session.user.id, tenantId);
    const canReadInbox = hasPermission(effectivePermissions, permissions.inboxRead);
    const canReadTickets = hasPermission(effectivePermissions, permissions.ticketsRead);
    const canReadLeads = hasPermission(effectivePermissions, permissions.contactsRead);
    const tenantObjectId = Types.ObjectId.isValid(tenantId) ? new Types.ObjectId(tenantId) : tenantId;
    const userObjectId = Types.ObjectId.isValid(session.user.id) ? new Types.ObjectId(session.user.id) : session.user.id;
    const assignedConversationScope = shouldScopeToAssignedConversations(effectivePermissions)
      ? { $or: [{ assignedAgentId: session.user.id }, { assigneeId: session.user.id }] }
      : {};
    const assignedAggregateScope = shouldScopeToAssignedConversations(effectivePermissions)
      ? { $or: [{ assignedAgentId: userObjectId }, { assigneeId: userObjectId }] }
      : {};
    const scopedConversationIds = canReadTickets && shouldScopeToAssignedTickets(effectivePermissions)
      ? await Conversation.find({
          tenantId,
          $or: [{ assignedAgentId: session.user.id }, { assigneeId: session.user.id }]
        }).select("_id").lean()
      : null;
    const ticketScope = scopedConversationIds
      ? { conversationId: { $in: scopedConversationIds.map((conversation) => conversation._id) } }
      : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [conversationChannels, activeConversations, unreadConversations, openTickets, newTickets, newLeads] = await Promise.all([
      canReadInbox ? Conversation.aggregate([
        { $match: { tenantId: tenantObjectId, ...assignedAggregateScope } },
        { $group: { _id: "$channel", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]) : [],
      canReadInbox ? Conversation.countDocuments({ tenantId, ...assignedConversationScope, status: { $in: ["open", "pending", "snoozed"] } }) : 0,
      canReadInbox ? Conversation.countDocuments({ tenantId, ...assignedConversationScope, unreadCount: { $gt: 0 }, status: { $nin: ["closed", "archived"] } }) : 0,
      canReadTickets ? Ticket.countDocuments({ tenantId, ...ticketScope, status: { $in: ["open", "in_progress", "pending"] } }) : 0,
      canReadTickets ? Ticket.countDocuments({ tenantId, ...ticketScope, status: { $in: ["open", "in_progress", "pending"] }, createdAt: { $gte: today } }) : 0,
      canReadLeads ? Lead.countDocuments({ tenantId, stage: "new" }) : 0,
    ]);

    return NextResponse.json({
      conversations: {
        active: activeConversations,
        unread: unreadConversations,
        byChannel: conversationChannels.map((item: any) => ({
          channel: item._id || "website",
          count: item.count || 0,
        })),
      },
      tickets: {
        open: openTickets,
        new: newTickets,
      },
      leads: {
        new: newLeads,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load sidebar counts" },
      { status: 500 },
    );
  }
}
