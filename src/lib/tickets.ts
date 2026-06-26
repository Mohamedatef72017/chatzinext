import crypto from "crypto";
import { Types } from "mongoose";
import { Bot, Conversation, Message, Ticket } from "@/lib/models";
import { connectToDatabase } from "@/lib/mongodb";
import { publishRealtimeEvent } from "@/lib/realtime";
import { normalizePhone, syncLeadFromTicket } from "@/lib/leads-from-tickets";

export type TicketCategory =
  | "technical_support"
  | "complaint"
  | "human_request"
  | "booking_request"
  | "sales_request"
  | "ai_failed"
  | "general";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type EnsureTicketInput = {
  tenantId: string;
  botId: string;
  conversationId: string;
  triggerReason: string;
  category: TicketCategory;
  priority?: TicketPriority;
  subject?: string;
  description?: string;
  aiSummary?: string;
  source?: "ai" | "agent" | "system";
  metadata?: Record<string, unknown>;
};

export type TicketIntentClassification = {
  shouldCreate: boolean;
  category: TicketCategory;
  priority: TicketPriority;
  reason: string;
};

export type TicketIssueTopic = {
  key: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  count: number;
  createdAt: string;
  lastSeenAt: string;
};

const OPEN_TICKET_STATUSES = ["open", "pending", "in_progress"];
const EASTERN_ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_ARABIC_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function buildSubject(input: {
  category: TicketCategory;
  triggerReason: string;
  externalUserId: string;
}) {
  const label = input.category.replace(/_/g, " ");
  return `${label} - ${input.externalUserId}`;
}

function getInputMetadata(input: EnsureTicketInput) {
  return input.metadata && typeof input.metadata === "object" ? input.metadata : {};
}

function getCustomerPhoneForTicket(input: EnsureTicketInput) {
  const metadata = getInputMetadata(input) as Record<string, unknown>;
  return normalizePhone(
    [
      metadata.normalizedCustomerPhone,
      metadata.customerPhone,
      metadata.phone,
      (metadata as any).contactPhone,
      (metadata as any).whatsapp,
      input.subject,
      input.description,
      input.aiSummary,
    ]
      .filter(Boolean)
      .join("\n")
  );
}

function normalizeDigits(value: string) {
  return String(value || "").replace(/[٠-٩۰-۹]/g, (char) => {
    const easternIndex = EASTERN_ARABIC_DIGITS.indexOf(char);
    if (easternIndex >= 0) return String(easternIndex);
    const persianIndex = PERSIAN_ARABIC_DIGITS.indexOf(char);
    return persianIndex >= 0 ? String(persianIndex) : char;
  });
}

function normalizeIssueIdentityText(value: string) {
  return normalizeDigits(value)
    .toLowerCase()
    .replace(/(?:\+|00)?\d[\d\s\-().]{6,}\d/g, " ")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function getIssueIdentityText(input: EnsureTicketInput) {
  const metadata = getInputMetadata(input) as Record<string, unknown>;
  const candidates = [
    metadata.issueDescription,
    metadata.interest,
    input.subject,
    input.description,
  ];
  for (const candidate of candidates) {
    const normalized = normalizeIssueIdentityText(String(candidate || ""));
    if (normalized) return normalized;
  }
  return "";
}

export function buildTicketIssueIdentityKey(input: EnsureTicketInput) {
  const issueText = getIssueIdentityText(input);
  const fallbackScope = issueText ? "" : input.conversationId;
  const source = [input.tenantId, input.botId, input.category, issueText || input.triggerReason, fallbackScope].join("|");
  return crypto.createHash("sha256").update(source).digest("hex");
}

export function buildTicketDedupeMatches(input: EnsureTicketInput, issueFingerprint: string, issueIdentityKey: string) {
  const normalizedCustomerPhone = getCustomerPhoneForTicket(input);
  const matches: Record<string, unknown>[] = [
    { conversationId: input.conversationId, "metadata.issueFingerprint": issueFingerprint },
    { conversationId: input.conversationId, "metadata.issueIdentityKey": issueIdentityKey },
    { conversationId: input.conversationId },
  ];

  if (normalizedCustomerPhone) {
    matches.push(
      { "metadata.normalizedCustomerPhone": normalizedCustomerPhone },
      { "metadata.customerPhone": normalizedCustomerPhone },
      { "metadata.phone": normalizedCustomerPhone },
      { "customFields.normalizedPhone": normalizedCustomerPhone },
      { "customFields.phone": normalizedCustomerPhone }
    );
  }

  return matches;
}

function getIssueTopicTitle(input: EnsureTicketInput) {
  const metadata = getInputMetadata(input) as Record<string, unknown>;
  const candidates = [
    metadata.issueDescription,
    metadata.interest,
    input.subject,
    input.description,
    input.triggerReason,
  ];
  for (const candidate of candidates) {
    const title = String(candidate || "").replace(/\s+/g, " ").trim();
    if (title) return title.slice(0, 160);
  }
  return input.category.replace(/_/g, " ");
}

function normalizeExistingIssueTopics(value: unknown): TicketIssueTopic[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      key: String(item.key || ""),
      title: String(item.title || "").slice(0, 160),
      category: (String(item.category || "general") as TicketCategory),
      priority: (String(item.priority || "medium") as TicketPriority),
      count: Math.max(1, Number(item.count || 1)),
      createdAt: String(item.createdAt || new Date().toISOString()),
      lastSeenAt: String(item.lastSeenAt || item.createdAt || new Date().toISOString()),
    }))
    .filter((item) => item.key && item.title);
}

export function mergeTicketIssueTopics(input: EnsureTicketInput, issueIdentityKey: string, existingMetadata?: Record<string, unknown>) {
  const now = new Date().toISOString();
  const topics = normalizeExistingIssueTopics(existingMetadata?.issueTopics);
  const title = getIssueTopicTitle(input);
  const index = topics.findIndex((topic) => topic.key === issueIdentityKey);

  if (index >= 0) {
    topics[index] = {
      ...topics[index],
      title: topics[index].title || title,
      category: input.category,
      priority: input.priority || topics[index].priority || "medium",
      count: topics[index].count + 1,
      lastSeenAt: now,
    };
  } else {
    topics.push({
      key: issueIdentityKey,
      title,
      category: input.category,
      priority: input.priority || "medium",
      count: 1,
      createdAt: now,
      lastSeenAt: now,
    });
  }

  return topics.slice(-50);
}

function buildAggregatedDescription(existingDescription: string, input: EnsureTicketInput, topics: TicketIssueTopic[]) {
  const latestTitle = topics[topics.length - 1]?.title || getIssueTopicTitle(input);
  const latestDescription = String(input.description || latestTitle || "").trim();
  const topicHeader = `موضوع ${topics.length}: ${latestTitle}`;
  const current = String(existingDescription || "").trim();

  if (!current) return latestDescription || topicHeader;
  if (current.includes(topicHeader) || (latestDescription && current.includes(latestDescription))) return current;

  return [current, [topicHeader, latestDescription].filter(Boolean).join("\n")].filter(Boolean).join("\n\n");
}

function withTicketCustomerMetadata(input: EnsureTicketInput, issueFingerprint: string, issueIdentityKey: string, existingMetadata?: Record<string, unknown>) {
  const metadata = getInputMetadata(input);
  const normalizedCustomerPhone = getCustomerPhoneForTicket(input);
  const issueTopics = mergeTicketIssueTopics(input, issueIdentityKey, existingMetadata);
  return {
    ...metadata,
    issueFingerprint,
    issueIdentityKey,
    issueTopics,
    issueTopicCount: issueTopics.length,
    latestIssueTopic: issueTopics[issueTopics.length - 1]?.title || "",
    ...(normalizedCustomerPhone
      ? {
          customerPhone: String((metadata as any).customerPhone || (metadata as any).phone || normalizedCustomerPhone),
          normalizedCustomerPhone,
        }
      : {}),
  };
}

export function classifyTicketIntent(_message: string): TicketIntentClassification {
  return { shouldCreate: false, category: "general", priority: "medium", reason: "ticket_intent_requires_ai_policy_engine" };
}

export async function ensureTicketForConversation(input: EnsureTicketInput) {
  await connectToDatabase();

  if (
    !Types.ObjectId.isValid(input.tenantId) ||
    !Types.ObjectId.isValid(input.botId) ||
    !Types.ObjectId.isValid(input.conversationId)
  ) {
    throw new Error("معرفات التذكرة غير صالحة.");
  }

  const conversation = await Conversation.findOne({
    _id: input.conversationId,
    tenantId: input.tenantId,
    botId: input.botId,
  });
  if (!conversation) throw new Error("المحادثة غير موجودة.");

  const issueFingerprint = buildTicketIssueFingerprint(input);
  const issueIdentityKey = buildTicketIssueIdentityKey(input);
  const existingTicketMatches = buildTicketDedupeMatches(input, issueFingerprint, issueIdentityKey);

  if (conversation.contactId) {
    existingTicketMatches.push({ contactId: conversation.contactId });
  }

  const existing = await Ticket.findOne({
    tenantId: input.tenantId,
    status: { $in: OPEN_TICKET_STATUSES },
    $or: existingTicketMatches,
  });

  if (existing) {
    const existingMetadata = existing.metadata && typeof existing.metadata === "object" ? existing.metadata as Record<string, unknown> : {};
    const nextMetadata = withTicketCustomerMetadata(input, issueFingerprint, issueIdentityKey, existingMetadata);
    const issueTopics = normalizeExistingIssueTopics(nextMetadata.issueTopics);
    const update: Record<string, unknown> = {
      triggerReason: input.triggerReason,
      category: input.category,
      priority: input.priority || existing.priority,
      metadata: {
        ...existingMetadata,
        ...nextMetadata,
        issueFingerprint,
        issueIdentityKey,
        lastTriggerReason: input.triggerReason,
      },
    };
    if (input.aiSummary) update.aiSummary = input.aiSummary;
    update.description = buildAggregatedDescription(String(existing.description || ""), input, issueTopics);

    await existing.updateOne({ $set: update });
    const refreshed = await Ticket.findById(existing._id);
    if (refreshed) {
      await syncLeadFromTicket({ tenantId: input.tenantId, ticketId: refreshed._id.toString() }).catch(() => null);
      await publishRealtimeEvent(input.tenantId, "ticket.updated", {
        ticket: {
          id: refreshed._id.toString(),
          number: refreshed.number || 0,
          subject: refreshed.subject || refreshed.title,
          status: refreshed.status,
          priority: refreshed.priority,
          category: refreshed.category,
          issueTopicCount: Number((refreshed.metadata as any)?.issueTopicCount || 1),
          updatedAt: refreshed.updatedAt?.toISOString?.() || new Date().toISOString(),
        },
        conversation: { id: input.conversationId },
      }).catch(() => undefined);
    }
    return refreshed;
  }

  const [counter, bot, lastMessages] = await Promise.all([
    Ticket.countDocuments({ tenantId: input.tenantId }),
    Bot.findById(input.botId).lean(),
    Message.find({
      tenantId: input.tenantId,
      botId: input.botId,
      conversationId: input.conversationId,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const transcriptSummary = lastMessages
    .reverse()
    .map((message) => `${message.sender}: ${message.content}`)
    .join("\n");
  const subject =
    input.subject ||
    buildSubject({
      category: input.category,
      triggerReason: input.triggerReason,
      externalUserId: conversation.externalUserId,
    });

  const createdTicket = await Ticket.create({
    tenantId: input.tenantId,
    botId: input.botId,
    contactId: conversation.contactId || undefined,
    conversationId: input.conversationId,
    number: counter + 1,
    subject,
    title: subject,
    description: input.description || transcriptSummary,
    status: "open",
    priority: input.priority || "medium",
    category: input.category,
    requesterExternalId: conversation.externalUserId,
    channel: conversation.channel,
    source: input.source || "ai",
    triggerReason: input.triggerReason,
    aiSummary:
      input.aiSummary ||
      `Bot: ${bot?.name || "-"}\nReason: ${input.triggerReason}\nCustomer: ${
        conversation.externalUserId
      }`,
    metadata: withTicketCustomerMetadata(input, issueFingerprint, issueIdentityKey),
  });

  await syncLeadFromTicket({ tenantId: input.tenantId, ticketId: createdTicket._id.toString() }).catch(() => null);
  await publishRealtimeEvent(input.tenantId, "ticket.created", {
    ticket: {
      id: createdTicket._id.toString(),
      number: createdTicket.number || 0,
      subject: createdTicket.subject || createdTicket.title,
      status: createdTicket.status,
      priority: createdTicket.priority,
      category: createdTicket.category,
      issueTopicCount: Number((createdTicket.metadata as any)?.issueTopicCount || 1),
      createdAt: createdTicket.createdAt?.toISOString?.() || new Date().toISOString(),
    },
    conversation: { id: input.conversationId },
  }).catch(() => undefined);

  return createdTicket;
}


function buildTicketIssueFingerprint(input: EnsureTicketInput) {
  const source = [input.tenantId, input.botId, input.conversationId, input.category, input.triggerReason, (input.subject || input.description || input.aiSummary || "").toLowerCase().replace(/\s+/g, " ").slice(0, 500)].join("|");
  return crypto.createHash("sha256").update(source).digest("hex");
}
