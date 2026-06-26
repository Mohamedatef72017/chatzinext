/**
 * business-intent.ts
 *
 * Conservative intent metadata for incoming customer messages.
 * Runtime workflows use AI structured classifiers for semantic routing.
 * This module intentionally avoids language-specific keyword lists.
 *
 * No hardcoded replies are produced here. This is routing metadata only.
 */

export type BusinessIntent =
  | "identity"
  | "services"
  | "products"
  | "prices"
  | "offers"
  | "contact"
  | "location"
  | "hours"
  | "appointment"
  | "doctor"
  | "faq"
  | "support"
  | "complaint"
  | "sales"
  | "human_request"
  | "follow_up"
  | "business"
  | "out_of_scope"
  | "unknown";

export function normalizeIntentText(input: string) {
  return String(input || "")
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deliberately does not classify with hardcoded phrases.
 * The AI CRM classifier handles semantic intent; this fallback keeps
 * knowledge retrieval broad instead of incorrectly narrowing it.
 */
export function detectBusinessIntent(message: string): BusinessIntent {
  const text = normalizeIntentText(message);
  if (!text) return "unknown";
  return "business";
}

/**
 * Returns true for any intent that should trigger knowledge entity lookup.
 * Only "unknown" and "out_of_scope" skip entity search.
 */
export function isDirectKnowledgeIntent(intent: BusinessIntent): boolean {
  return intent !== "unknown" && intent !== "out_of_scope";
}

/**
 * Returns true for intents that suggest the customer is close to a purchase/booking decision.
 * Used by the workflow to signal the LLM to apply sales closing behavior.
 */
export function isPurchaseReadyIntent(intent: BusinessIntent): boolean {
  return intent === "appointment" || intent === "sales" || intent === "prices";
}

/**
 * Returns true for intents that require careful emotional handling.
 */
export function isHighSensitivityIntent(intent: BusinessIntent): boolean {
  return intent === "complaint" || intent === "human_request" || intent === "support";
}

/**
 * Maps a detected intent to the most relevant KnowledgeEntity types for lookup.
 * Returns string[] to avoid circular imports with knowledge-entities.ts.
 * Returns empty array for intents that do not benefit from entity search.
 */
export function entityTypesForIntent(intent: BusinessIntent): string[] {
  const map: Partial<Record<BusinessIntent, string[]>> = {
    identity:     ["business_info"],
    services:     ["service"],
    products:     ["product"],
    prices:       ["price", "service", "product"],
    offers:       ["offer"],
    contact:      ["contact", "branch"],
    location:     ["branch", "contact"],
    hours:        ["branch", "business_info", "appointment_rule"],
    appointment:  ["appointment_rule", "service", "doctor"],
    doctor:       ["doctor", "service"],
    faq:          ["faq", "policy"],
    support:      ["support", "faq"],
    complaint:    ["support", "policy"],
    sales:        ["product", "service", "price", "offer"],
    business:     ["service", "product", "faq", "business_info"],
    follow_up:    [],
    human_request:[],
    out_of_scope: [],
    unknown:      [],
  };
  return map[intent] ?? [];
}
