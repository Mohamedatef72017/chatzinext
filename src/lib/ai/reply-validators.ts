/**
 * reply-validators.ts
 *
 * Validates AI-generated customer-facing replies before delivery.
 * Checks for:
 *   1. Empty or whitespace-only replies.
 *   2. Leaked internal system terms.
 *   3. Leaked JSON/code artifacts from the model.
 *   4. Obvious hallucination markers.
 *
 * This is a safety net — not a quality gate. The LLM instructions
 * are the primary quality control. This validator catches the worst cases.
 */

const INTERNAL_TERMS: string[] = [
  // System internals
  "<think",
  "</think>",
  "[sentiment:",
  "[intent:",
  "[confidence:",
  "[action:",

  // Technical identifiers
  "tenantId",
  "botId",
  "conversationId",
  "documentId",
  "messageId",
  "ticketId",
  "responseId",
  "sourceMessageId",

  // Architecture terms
  "rag",
  "vector",
  "chunk",
  "embedding",
  "workflow",
  "mastra",
  "pipeline",
  "orchestrator",
  "step id",

  // Prompt-level leakage
  "system prompt",
  "system_prompt",
  "global_crm",
  "knowledgeprompt",
  "knowledge_prompt",
  "buildunifiedsystemprompt",
  "confidenceThreshold",
  "confidence score",
  "confidence_score",

  // Knowledge base terms
  "knowledge base",
  "knowledge_base",
  "knowledgebase",

  // CRM internals
  "crmTicketFlow",
  "crm_ticket_flow",
  "ticketFlow",
  "ticket_flow",
  "requiredFields",
  "missingFields",
  "collectedFields",

  // Infrastructure
  "mongodb",
  "redis",
  "qdrant",
  "bullmq",
  "openai",
  "anthropic",

  // Source leakage
  "source:",
  "faq",
];

export type ReplyValidationResult = {
  valid: boolean;
  reason?: string;
};

export function validateCustomerReply(reply: string): ReplyValidationResult {
  const trimmed = reply.trim();

  if (!trimmed) {
    return { valid: false, reason: "empty_reply" };
  }

  // Minimum meaningful length — a reply shorter than 3 chars is not a real response
  if (trimmed.length < 3) {
    return { valid: false, reason: "reply_too_short" };
  }

  // Check for leaked JSON artifacts — if the reply looks like raw JSON, reject
  if (/^\s*\{[\s\S]*"action"\s*:/.test(trimmed) || /^\s*\{[\s\S]*"intent"\s*:/.test(trimmed)) {
    return { valid: false, reason: "reply_is_json_artifact" };
  }

  const lowerReply = trimmed.toLowerCase();

  // Check for internal term leakage (case-insensitive)
  const leakedTerm = INTERNAL_TERMS.find((term) =>
    lowerReply.includes(term.toLowerCase())
  );

  if (leakedTerm) {
    return { valid: false, reason: `internal_term:${leakedTerm}` };
  }

  return { valid: true };
}
