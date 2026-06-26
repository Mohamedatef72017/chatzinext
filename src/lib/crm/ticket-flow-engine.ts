import { Conversation } from "@/lib/models";
import type { TicketCategory, TicketIntentClassification, TicketPriority } from "@/lib/tickets";
import { classifyTicketMessageWithAi, type TicketClassifierConversationMessage } from "@/lib/crm/ticket-ai-classifier";
import { getCrmTicketPolicy, priorityForCategory, type CrmTicketPolicy, type TicketRequiredField } from "@/lib/crm/ticket-policy";

export type { TicketRequiredField } from "@/lib/crm/ticket-policy";

export type TicketFlowAction = "none" | "ask_missing_fields" | "answer_current_message" | "create_ticket";
export type TicketFlowState = {
  version: 1;
  status: "collecting_required_fields" | "paused_for_context" | "ready_to_create" | "created";
  category: TicketCategory;
  priority: TicketPriority;
  reason: string;
  requiredFields: TicketRequiredField[];
  missingFields: TicketRequiredField[];
  collectedFields: Partial<Record<TicketRequiredField, string>>;
  startedAt: string;
  updatedAt: string;
  lastCustomerMessage?: string;
  lastInterruptReason?: string;
  ticketId?: string;
  ticketNumber?: number;
};
export type TicketFlowResult = {
  action: TicketFlowAction;
  state?: TicketFlowState;
  category?: TicketCategory;
  priority?: TicketPriority;
  reason?: string;
  missingFields?: TicketRequiredField[];
  collectedFields?: Partial<Record<TicketRequiredField, string>>;
  interrupted?: boolean;
  readyToCreate?: boolean;
};

function normalizeDigits(value: string) {
  const easternArabic = "٠١٢٣٤٥٦٧٨٩";
  const persianArabic = "۰۱۲۳۴۵۶۷۸۹";
  return String(value || "").replace(/[٠-٩۰-۹]/g, (char) => {
    const easternIndex = easternArabic.indexOf(char);
    if (easternIndex >= 0) return String(easternIndex);
    const persianIndex = persianArabic.indexOf(char);
    return persianIndex >= 0 ? String(persianIndex) : char;
  });
}

function normalizePhone(value?: string | null) {
  if (!value) return "";
  const normalized = normalizeDigits(String(value));
  const phoneLike = normalized.match(/(?:\+|00)?\d[\d\s\-().]{6,}\d/g)?.[0] || normalized;
  const cleaned = phoneLike.replace(/[^\d+]/g, "");
  const prefix = cleaned.startsWith("+") ? "+" : "";
  const digits = cleaned.replace(/\D/g, "").replace(/^00/, "");
  return digits.length >= 7 ? `${prefix}${digits}` : "";
}

function cleanField(value: unknown, field: TicketRequiredField) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (field === "phone") return normalizePhone(raw);
  return raw.slice(0, field === "issueDescription" ? 1200 : 120);
}
function asTicketFlowState(value: unknown): TicketFlowState | null {
  if (!value || typeof value !== "object") return null;
  const state = value as TicketFlowState;
  if (state.version !== 1) return null;
  if (!state.category || !Array.isArray(state.requiredFields)) return null;
  if (state.status === "created") return null;
  return state;
}
function mergeFields(requiredFields: TicketRequiredField[], previous: Partial<Record<TicketRequiredField, string>> | undefined, next: Partial<Record<TicketRequiredField, string>>) {
  return requiredFields.reduce((acc, field) => {
    const value = cleanField(next[field] || previous?.[field] || "", field);
    if (value) acc[field] = value;
    return acc;
  }, {} as Partial<Record<TicketRequiredField, string>>);
}
function missingFields(requiredFields: TicketRequiredField[], fields: Partial<Record<TicketRequiredField, string>>) {
  return requiredFields.filter((field) => !cleanField(fields[field], field));
}
async function saveState(input: { tenantId: string; botId: string; conversationId: string; state: TicketFlowState }) {
  await Conversation.updateOne({ _id: input.conversationId, tenantId: input.tenantId, botId: input.botId }, { $set: { "metadata.crmTicketFlow": input.state } });
}
export async function clearTicketFlow(input: { tenantId: string; botId: string; conversationId: string; ticketId?: string; ticketNumber?: number }) {
  const now = new Date().toISOString();
  await Conversation.updateOne({ _id: input.conversationId, tenantId: input.tenantId, botId: input.botId }, { $set: { "metadata.crmTicketFlow.status": "created", "metadata.crmTicketFlow.ticketId": input.ticketId || "", "metadata.crmTicketFlow.ticketNumber": input.ticketNumber || 0, "metadata.crmTicketFlow.updatedAt": now } });
}

export async function processTicketFlow(input: {
  tenantId: string;
  botId: string;
  conversationId: string;
  message: string;
  conversationMetadata?: Record<string, unknown> | null;
  detectedIntent?: TicketIntentClassification | null;
  ticketPolicy?: unknown;
  languageMode?: string;
  businessCategory?: string;
  businessSubcategory?: string;
  customInstructionsEn?: string;
  conversationMessages?: TicketClassifierConversationMessage[];
  providedFields?: Partial<Record<TicketRequiredField, string>>;
}) : Promise<TicketFlowResult> {
  const now = new Date().toISOString();
  const metadata = input.conversationMetadata || {};
  const activeState = asTicketFlowState((metadata as any).crmTicketFlow);
  const policy: CrmTicketPolicy = getCrmTicketPolicy(input.ticketPolicy);
  const requiredFields = activeState?.requiredFields?.length ? activeState.requiredFields : policy.requiredFields;
  const requestedCategory = input.detectedIntent?.shouldCreate ? input.detectedIntent.category : undefined;
  const requestedPriority = input.detectedIntent?.shouldCreate ? input.detectedIntent.priority : undefined;
  const classification = await classifyTicketMessageWithAi({ tenantId: input.tenantId, botId: input.botId, message: input.message, policy, activeState, languageMode: input.languageMode, businessCategory: input.businessCategory, businessSubcategory: input.businessSubcategory, customInstructionsEn: input.customInstructionsEn, requestedCategory, requestedPriority, reasonHint: input.detectedIntent?.reason, conversationMessages: input.conversationMessages });
  const latestFields = mergeFields(requiredFields, undefined, { ...classification.collectedFields, ...(input.providedFields || {}) });
  const providedMissingFields = activeState?.missingFields?.filter((field) => cleanField(latestFields[field], field)) || [];

  if (activeState && providedMissingFields.length === 0 && (classification.action === "answer_current_message" || classification.action === "cancel_ticket_flow")) {
    const state: TicketFlowState = { ...activeState, status: "paused_for_context", updatedAt: now, lastCustomerMessage: input.message, lastInterruptReason: classification.reason || classification.action };
    await saveState({ ...input, state });
    return { action: "answer_current_message", state, category: state.category, priority: state.priority, reason: classification.reason || "ticket_flow_paused", missingFields: state.missingFields, collectedFields: state.collectedFields, interrupted: true };
  }

  if (activeState) {
    const fields = mergeFields(requiredFields, activeState.collectedFields, latestFields);
    const missing = missingFields(requiredFields, fields);
    const state: TicketFlowState = { ...activeState, status: missing.length ? "collecting_required_fields" : "ready_to_create", collectedFields: fields, missingFields: missing, requiredFields, updatedAt: now, lastCustomerMessage: input.message };
    await saveState({ ...input, state });
    return { action: missing.length ? "ask_missing_fields" : "create_ticket", state, category: state.category, priority: state.priority, reason: missing.length ? "ticket_required_fields_missing" : "ticket_required_fields_complete", missingFields: missing, collectedFields: fields, readyToCreate: missing.length === 0 };
  }

  const shouldStart = input.detectedIntent?.shouldCreate === true || classification.action === "start_ticket_flow" || classification.action === "continue_ticket_flow";
  if (!shouldStart) return { action: "none" };

  const category = classification.category || requestedCategory || "general";
  const priority = classification.priority || requestedPriority || priorityForCategory(policy, category);
  const fields = mergeFields(requiredFields, undefined, latestFields);
  const missing = missingFields(requiredFields, fields);
  const state: TicketFlowState = { version: 1, status: missing.length ? "collecting_required_fields" : "ready_to_create", category, priority, reason: classification.reason || input.detectedIntent?.reason || "crm_ticket_flow_started", requiredFields, missingFields: missing, collectedFields: fields, startedAt: now, updatedAt: now, lastCustomerMessage: input.message };
  await saveState({ ...input, state });
  return { action: missing.length ? "ask_missing_fields" : "create_ticket", state, category: state.category, priority: state.priority, reason: missing.length ? "ticket_required_fields_missing" : "ticket_required_fields_complete", missingFields: missing, collectedFields: fields, readyToCreate: missing.length === 0 };
}

export function buildTicketFlowContext(flow?: TicketFlowResult) {
  if (!flow || flow.action === "none" || !flow.state) return "";
  const fields = flow.state.collectedFields || {};
  const parts = [
    `crmTicketFlow.action=${flow.action}`,
    `crmTicketFlow.status=${flow.state.status}`,
    `crmTicketFlow.category=${flow.state.category}`,
    `crmTicketFlow.requiredFields=${flow.state.requiredFields.join(",")}`,
    `crmTicketFlow.missingFields=${flow.state.missingFields.join(",") || "none"}`,
    `crmTicketFlow.hasName=${Boolean(fields.name)}`,
    `crmTicketFlow.hasPhone=${Boolean(fields.phone)}`,
    `crmTicketFlow.hasIssueDescription=${Boolean(fields.issueDescription)}`,
    "crmTicketFlow.customerVisibleTextPolicy=AI_GENERATED_ONLY",
  ];
  if (flow.action === "ask_missing_fields") parts.push("crmTicketFlow.replyGoal=Generate a warm, natural customer-facing message asking for ALL the listed missing fields in one single message. Do not number them as a form. Do not say a ticket is created yet. React to the customer's last message first, then ask only for what is still missing. Match the customer's language, tone, and emotional state from the conversation. Be human, lightly expressive, and not mechanical.");
  if (flow.action === "answer_current_message") parts.push("crmTicketFlow.replyGoal=The customer switched to a different topic. Answer their current question fully from business knowledge. Keep the pending ticket flow open silently — do not mention it unless the customer brings it up again.");
  if (flow.action === "create_ticket") parts.push("crmTicketFlow.replyGoal=The required fields are complete and the system is registering the request. Confirm this naturally and warmly in the customer's language and configured tone. Mention the ticket number if available. Do NOT use a fixed template or canned phrase. Sound like an attentive employee who understood the request, not like a rigid form. Match the register of the conversation — formal if they were formal, warm if they were casual. Invite them to ask if they need anything else.");
  return parts.join("; ");
}
