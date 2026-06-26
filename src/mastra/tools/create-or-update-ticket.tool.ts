import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { Types } from "mongoose";
import { ensureTicketForConversation } from "@/lib/tickets";
import { processTicketFlow } from "@/lib/crm/ticket-flow-engine";

const ticketToolInputSchema = z.object({
  tenantId: z.string().min(1),
  botId: z.string().min(1),
  conversationId: z.string().min(1),
  category: z.enum([
    "technical_support",
    "complaint",
    "human_request",
    "booking_request",
    "sales_request",
    "ai_failed",
    "general",
  ]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  triggerReason: z.string().min(1),
  subject: z.string().optional(),
  description: z.string().optional(),
  aiSummary: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  issueDescription: z.string().optional(),
});

const ticketToolOutputSchema = z.object({
  ticketId: z.string(),
  status: z.string(),
  category: z.string(),
  priority: z.string(),
});

export const createOrUpdateTicketTool = createTool({
  id: "create-or-update-ticket",
  description:
    "Create or update a tenant-isolated CRM ticket for confirmed booking, support, complaint, sales, or human-handoff intent. Never guess identifiers.",
  inputSchema: ticketToolInputSchema,
  outputSchema: ticketToolOutputSchema,
  execute: async (input) => {
    if (
      !Types.ObjectId.isValid(input.tenantId) ||
      !Types.ObjectId.isValid(input.botId) ||
      !Types.ObjectId.isValid(input.conversationId)
    ) {
      throw new Error("Invalid tenant, bot, or conversation identifier.");
    }

    const flow = await processTicketFlow({
      tenantId: input.tenantId,
      botId: input.botId,
      conversationId: input.conversationId,
      message: [
        input.issueDescription || input.subject,
        input.description,
        input.aiSummary,
      ].filter(Boolean).join("\n"),
      providedFields: {
        name: input.customerName,
        phone: input.customerPhone,
        issueDescription: input.issueDescription,
      },
      detectedIntent: {
        shouldCreate: true,
        category: input.category,
        priority: (input.priority || "medium") as "low" | "medium" | "high" | "urgent",
        reason: input.triggerReason,
      },
    });

    if (flow.action !== "create_ticket") {
      return {
        ticketId: "",
        status: String(flow.state?.status || "collecting_required_fields"),
        category: String(input.category),
        priority: String(input.priority),
      };
    }

    const fields = flow.collectedFields || {};
    const customerName = String(fields.name || input.customerName || "").trim();
    const customerPhone = String(fields.phone || input.customerPhone || "").trim();
    const issueDescription = String(fields.issueDescription || input.issueDescription || input.description || input.subject || "").trim();
    const ticket = await ensureTicketForConversation({
      tenantId: input.tenantId,
      botId: input.botId,
      conversationId: input.conversationId,
      category: input.category,
      priority: (input.priority || "medium") as "low" | "medium" | "high" | "urgent",
      triggerReason: input.triggerReason,
      subject: input.subject || issueDescription.slice(0, 120),
      description: issueDescription,
      aiSummary: input.aiSummary,
      metadata: {
        sourceTool: "mastra.create-or-update-ticket",
        customerName,
        customerPhone,
        issueDescription,
        crmTicketFlow: flow.state || null,
      },
    });

    return {
      ticketId: ticket?._id?.toString() || "",
      status: String(ticket?.status || "open"),
      category: String(ticket?.category || input.category),
      priority: String(ticket?.priority || input.priority),
    };
  },
});
