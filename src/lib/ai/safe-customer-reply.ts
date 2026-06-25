/**
 * safe-customer-reply.ts
 *
 * Generates a safe, natural customer-facing reply when:
 *   - The main AI generation failed or produced an invalid reply.
 *   - Content moderation blocked the message.
 *   - A human handoff is needed.
 *   - A ticket was just created and needs confirmation.
 *   - The knowledge base returned no useful results.
 *
 * All replies are LLM-generated — no hardcoded templates.
 */

import { routeAiRequest } from "@/lib/ai-router";
import { buildUnifiedSystemPrompt } from "@/lib/ai/build-system-prompt";
import { logger } from "@/lib/logger";

export type SafeReplyIntent =
  | "fallback"          // General fallback when AI failed
  | "moderation"        // Message was blocked by moderation
  | "handoff"           // Customer is being transferred to a human
  | "ticket_created"    // A CRM ticket was just created
  | "no_knowledge"      // Knowledge base returned nothing
  | "clarification"     // AI needs to ask for clarification
  | "out_of_scope";     // Customer asked something outside business scope

export async function buildSafeCustomerReply(input: {
  tenantId: string;
  botId?: string;
  customerMessage: string;
  businessName?: string;
  botName?: string;
  language?: string;
  intent?: SafeReplyIntent | string;
  reason?: string;
  hasKnowledge?: boolean;
  customInstructions?: string;
  knowledgeSummary?: string;
  contextSummary?: string;
}): Promise<string> {
  try {
    const intent = (input.intent || "fallback") as SafeReplyIntent | string;

    const intentInstruction = buildIntentInstruction(intent, input.hasKnowledge);

    const systemPrompt = buildUnifiedSystemPrompt({
      businessName: input.businessName,
      botName: input.botName,
      language: input.language || "auto",
      customInstructions: input.customInstructions,
      knowledgeInstructions: input.knowledgeSummary,
      contextSummary: input.contextSummary,
      tone: "professional, empathetic, concise, helpful",
      responseLength: "short",
    });

    const userInput = JSON.stringify({
      task: intentInstruction,
      customerMessage: input.customerMessage,
      detectedIntent: intent,
      reason: input.reason || "safe_reply_needed",
      hasKnowledge: Boolean(input.hasKnowledge),
      instructions: [
        "Generate one natural customer-facing reply in the customer's detected language.",
        "Do NOT use canned phrases or fixed templates.",
        "Do NOT invent business-specific facts (prices, availability, addresses, policies).",
        "Match the customer's emotional register — if they are frustrated, be more empathetic; if they are casual, be warm.",
        "Keep the reply concise and focused on the next useful step.",
        "Do NOT mention internal systems, tools, RAG, tickets, or workflows.",
      ].join(" "),
    });

    const result = await routeAiRequest({
      systemPrompt,
      userInput,
      temperature: 0.3,
    });

    return String(result.reply || "").trim();
  } catch (error) {
    logger.warn("ai.safe_customer_reply_failed", {
      tenantId: input.tenantId,
      botId: input.botId,
      intent: input.intent,
      error: error instanceof Error ? error.message : String(error),
    });
    return "";
  }
}

function buildIntentInstruction(intent: SafeReplyIntent | string, hasKnowledge?: boolean): string {
  switch (intent) {
    case "moderation":
      return "The customer's message could not be processed due to content policy. Write a calm, respectful reply that declines to answer this type of message without being preachy, and invite the customer to ask about business services instead.";

    case "handoff":
      return "The customer is being transferred to a human agent. Write a natural, warm transition message that sets the expectation clearly without making them feel rejected. Do not say 'I am just a bot'. Make it feel like a natural escalation to dedicated specialist support.";

    case "ticket_created":
      return "A support or booking request was just registered in the system. Write a warm confirmation that the request has been received, that the team will follow up, and invite the customer to ask if they need anything else. Be natural and specific to the conversation tone — do not use a generic template.";

    case "no_knowledge":
      return hasKnowledge
        ? "The knowledge base returned limited information. Use what is available to give the closest useful answer, and mention that the team can confirm full details."
        : "No specific information was found in the knowledge base for this question. Write a polite response that acknowledges the question, explains that this specific detail can be confirmed by the team, and offers a concrete next step (contact, booking, inquiry).";

    case "out_of_scope":
      return "The customer asked about something outside this business's scope. Write a polite, natural response that acknowledges their message, explains that you specialize in this business's services, and invites them to ask about what you can actually help with.";

    case "clarification":
      return "The customer's message was unclear. Write a brief, natural message asking ONE focused clarifying question that helps you understand what they need. Do not ask multiple questions at once.";

    case "fallback":
    default:
      return hasKnowledge
        ? "The main AI response failed. Use the available business knowledge context to give the closest useful answer, and mention that the team can confirm details if needed."
        : "The AI could not generate a complete answer. Write a helpful bridging reply that acknowledges the customer's message, offers one natural next step within the business scope, and keeps the conversation open.";
  }
}
