/**
 * business-intent.ts
 *
 * Semantic intent classification for incoming customer messages.
 * Used to inform knowledge search routing and entity lookup strategy.
 * All classification is rule-based on surface signals only — deeper
 * reasoning is delegated to the LLM in the generate-reply step.
 *
 * No hardcoded replies are produced here. This is routing metadata only.
 */

export type BusinessIntent =
  | "identity"        // Who are you / what is this bot
  | "services"        // What services do you offer
  | "products"        // Products / items / catalog
  | "prices"          // Price / cost / how much / سعر / كم
  | "offers"          // Discount / offer / promo / تخفيض
  | "contact"         // Phone / email / reach / كيف أتواصل
  | "location"        // Address / branch / where / عنوان
  | "hours"           // Working hours / open / close / مواعيد
  | "appointment"     // Book / reserve / schedule / حجز
  | "doctor"          // Specific person / specialist / doctor / طبيب
  | "faq"             // General how-does-it-work / policy / FAQ
  | "support"         // Problem / issue / not working / مشكلة
  | "complaint"       // Complaint / bad experience / شكوى
  | "sales"           // Buy / purchase / order / أشتري
  | "human_request"   // Talk to human / agent / موظف
  | "follow_up"       // Continuation of previous topic
  | "business"        // General business question (fallback)
  | "out_of_scope"    // Completely unrelated to the business
  | "unknown";        // Cannot determine

export function normalizeIntentText(input: string) {
  return String(input || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Lightweight signal-based intent detector.
 * Uses keyword patterns in Arabic and English.
 * Returns the most specific match, or "business" as a safe fallback.
 *
 * Intentionally conservative — when in doubt, returns "business"
 * so the full knowledge search runs rather than being skipped.
 */
export function detectBusinessIntent(message: string): BusinessIntent {
  const text = normalizeIntentText(message);
  if (!text) return "unknown";

  // Identity
  if (/\b(who are you|what are you|من أنت|من انتي|إيه ده|ايه ده|مين انت|بتمثل مين)\b/.test(text)) return "identity";

  // Human handoff
  if (/\b(human|agent|representative|talk to someone|real person|موظف|انسان|بشر|تكلم واحد|عايز حد|أكلم حد)\b/.test(text)) return "human_request";

  // Complaint
  if (/\b(complaint|complain|bad experience|worst|terrible|شكوى|أشتكي|زفت|وحش|غلط|مش كويس|مش تمام|ضايقني)\b/.test(text)) return "complaint";

  // Support / problem
  if (/\b(problem|issue|error|not working|broken|fix|help me|مشكلة|عطل|خطأ|بيشتغل|مش بيشتغل|تعطل|محتاج مساعدة|مش رادة)\b/.test(text)) return "support";

  // Prices
  if (/\b(price|cost|how much|fee|rate|سعر|كم|بكام|تكلفة|رسوم|اشتراك|اسعار)\b/.test(text)) return "prices";

  // Offers / discounts
  if (/\b(discount|offer|promo|deal|coupon|تخفيض|عرض|خصم|بروموشن|كوبون)\b/.test(text)) return "offers";

  // Appointment / booking
  if (/\b(book|appointment|reserve|schedule|booking|slot|حجز|موعد|أحجز|أحجزلي|اجزلي|مواعيد متاحة)\b/.test(text)) return "appointment";

  // Location
  if (/\b(address|location|where|branch|near|directions|عنوان|فين|موقع|فرع|قريب منين)\b/.test(text)) return "location";

  // Hours
  if (/\b(hours|open|close|when|schedule|working|مواعيد|امتى|بيفتح|بيقفل|تفتح|تقفل|وقت)\b/.test(text)) return "hours";

  // Contact
  if (/\b(contact|phone|email|whatsapp|call|reach|تواصل|تليفون|واتساب|ايميل|كيف أتواصل)\b/.test(text)) return "contact";

  // Services
  if (/\b(services|what do you|what can you|offer|provide|خدمات|إيه بتقدم|ايه عندكم|تعملوا ايه)\b/.test(text)) return "services";

  // Products
  if (/\b(product|item|catalog|collection|منتج|منتجات|بضاعة|قائمة|كتالوج)\b/.test(text)) return "products";

  // Doctor / specialist
  if (/\b(doctor|dr\.|specialist|physician|طبيب|دكتور|أخصائي|د\.)\b/.test(text)) return "doctor";

  // Sales / purchase intent
  if (/\b(buy|purchase|order|i want|i'd like|اشتري|عايز أشتري|أطلب|بدي|بغي)\b/.test(text)) return "sales";

  // FAQ / policy
  if (/\b(how does|policy|terms|faq|frequently|conditions|كيف|ازاي|شروط|سياسة|أسئلة شائعة)\b/.test(text)) return "faq";

  // Out of scope — clearly unrelated general topics
  if (/\b(weather|politics|football|movie|joke|recipe|طقس|سياسة|أكل|نكتة|أفلام|رياضة)\b/.test(text)) return "out_of_scope";

  // Default — route to full knowledge search
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
