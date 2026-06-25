/**
 * seed-plan-features.ts
 *
 * Migration script: adds features[] to existing BillingPlan records
 * that were created before the feature-based billing refactor.
 *
 * Run:
 *   ts-node -r tsconfig-paths/register --compiler-options '{"module":"commonjs"}' scripts/seed-plan-features.ts
 *
 * Safe to run multiple times — uses upsert logic.
 * Does NOT remove or modify existing features if already set.
 */

import { connectToDatabase } from "../src/lib/mongodb";
import { BillingPlan, FeatureDefinition } from "../src/lib/models";

const PLAN_FEATURE_MAP: Record<string, Array<{
  key: string;
  type: "boolean" | "quota" | "count" | "storage" | "metered";
  enabled?: boolean;
  limit?: number;
  resetPeriod?: "monthly" | "yearly" | "never";
  unit?: string;
}>> = {
  free: [
    { key: "ai_messages",       type: "quota",   limit: 100,    resetPeriod: "monthly", unit: "message" },
    { key: "max_channels",      type: "count",   limit: 2 },
    { key: "max_agents",        type: "count",   limit: 1 },
    { key: "max_bots",          type: "count",   limit: 1 },
    { key: "max_team_members",  type: "count",   limit: 3 },
    { key: "knowledge_enabled", type: "boolean", enabled: false },
    { key: "advanced_ai",       type: "boolean", enabled: false },
    { key: "api_access",        type: "boolean", enabled: false },
    { key: "white_label",       type: "boolean", enabled: false },
    { key: "qdrant_search",     type: "boolean", enabled: false },
    { key: "max_telegram_channels",  type: "count", limit: 1 },
    { key: "max_whatsapp_numbers",   type: "count", limit: 0 },
    { key: "max_facebook_pages",     type: "count", limit: 0 },
    { key: "max_instagram_accounts", type: "count", limit: 0 }
  ],
  starter: [
    { key: "ai_messages",       type: "quota",   limit: 1000,   resetPeriod: "monthly", unit: "message" },
    { key: "max_channels",      type: "count",   limit: 5 },
    { key: "max_agents",        type: "count",   limit: 5 },
    { key: "max_bots",          type: "count",   limit: 3 },
    { key: "max_team_members",  type: "count",   limit: 10 },
    { key: "knowledge_enabled", type: "boolean", enabled: true },
    { key: "advanced_ai",       type: "boolean", enabled: false },
    { key: "api_access",        type: "boolean", enabled: true },
    { key: "white_label",       type: "boolean", enabled: false },
    { key: "qdrant_search",     type: "boolean", enabled: false },
    { key: "max_telegram_channels",  type: "count", limit: 2 },
    { key: "max_whatsapp_numbers",   type: "count", limit: 1 },
    { key: "max_facebook_pages",     type: "count", limit: 1 },
    { key: "max_instagram_accounts", type: "count", limit: 1 }
  ],
  pro: [
    { key: "ai_messages",       type: "quota",   limit: 10000,  resetPeriod: "monthly", unit: "message" },
    { key: "max_channels",      type: "count",   limit: 20 },
    { key: "max_agents",        type: "count",   limit: 25 },
    { key: "max_bots",          type: "count",   limit: 10 },
    { key: "max_team_members",  type: "count",   limit: 50 },
    { key: "knowledge_enabled", type: "boolean", enabled: true },
    { key: "advanced_ai",       type: "boolean", enabled: true },
    { key: "api_access",        type: "boolean", enabled: true },
    { key: "white_label",       type: "boolean", enabled: false },
    { key: "qdrant_search",     type: "boolean", enabled: true },
    { key: "max_telegram_channels",  type: "count", limit: 5 },
    { key: "max_whatsapp_numbers",   type: "count", limit: 3 },
    { key: "max_facebook_pages",     type: "count", limit: 3 },
    { key: "max_instagram_accounts", type: "count", limit: 3 }
  ],
  enterprise: [
    { key: "ai_messages",       type: "quota",   limit: 999999, resetPeriod: "monthly", unit: "message" },
    { key: "max_channels",      type: "count",   limit: 999 },
    { key: "max_agents",        type: "count",   limit: 999 },
    { key: "max_bots",          type: "count",   limit: 999 },
    { key: "max_team_members",  type: "count",   limit: 999 },
    { key: "knowledge_enabled", type: "boolean", enabled: true },
    { key: "advanced_ai",       type: "boolean", enabled: true },
    { key: "api_access",        type: "boolean", enabled: true },
    { key: "white_label",       type: "boolean", enabled: true },
    { key: "qdrant_search",     type: "boolean", enabled: true },
    { key: "max_telegram_channels",  type: "count", limit: 999 },
    { key: "max_whatsapp_numbers",   type: "count", limit: 999 },
    { key: "max_facebook_pages",     type: "count", limit: 999 },
    { key: "max_instagram_accounts", type: "count", limit: 999 },
    { key: "audit_logs",  type: "boolean", enabled: true },
    { key: "webhooks",    type: "boolean", enabled: true },
    { key: "custom_domain", type: "boolean", enabled: true }
  ]
};

const FEATURE_DEFINITIONS = [
  { key: "ai_messages",            name: "AI Messages",         type: "quota",   unit: "message", resetPeriod: "monthly",  description: "Monthly AI reply quota" },
  { key: "max_channels",           name: "Channels",            type: "count",   unit: "channel", resetPeriod: "never",    description: "Total connected channels" },
  { key: "max_agents",             name: "AI Agents",           type: "count",   unit: "agent",   resetPeriod: "never",    description: "Number of AI agents" },
  { key: "max_bots",               name: "Bots",                type: "count",   unit: "bot",     resetPeriod: "never",    description: "Number of chatbots" },
  { key: "max_team_members",       name: "Team Members",        type: "count",   unit: "seat",    resetPeriod: "never",    description: "Number of team seats" },
  { key: "knowledge_enabled",      name: "Knowledge Base",      type: "boolean", unit: "",        resetPeriod: "never",    description: "Enable knowledge base and RAG" },
  { key: "advanced_ai",            name: "Advanced AI",         type: "boolean", unit: "",        resetPeriod: "never",    description: "GPT-4, Claude, and premium models" },
  { key: "api_access",             name: "API Access",          type: "boolean", unit: "",        resetPeriod: "never",    description: "Programmatic API access" },
  { key: "white_label",            name: "White Label",         type: "boolean", unit: "",        resetPeriod: "never",    description: "Remove ChatZi branding" },
  { key: "qdrant_search",          name: "Vector Search",       type: "boolean", unit: "",        resetPeriod: "never",    description: "Qdrant-powered semantic search" },
  { key: "max_telegram_channels",  name: "Telegram Channels",   type: "count",   unit: "channel", resetPeriod: "never",    description: "Telegram channels count" },
  { key: "max_whatsapp_numbers",   name: "WhatsApp Numbers",    type: "count",   unit: "number",  resetPeriod: "never",    description: "WhatsApp Business numbers" },
  { key: "max_facebook_pages",     name: "Facebook Pages",      type: "count",   unit: "page",    resetPeriod: "never",    description: "Facebook Pages count" },
  { key: "max_instagram_accounts", name: "Instagram Accounts",  type: "count",   unit: "account", resetPeriod: "never",    description: "Instagram accounts count" },
  { key: "audit_logs",             name: "Audit Logs",          type: "boolean", unit: "",        resetPeriod: "never",    description: "Access to audit logs" },
  { key: "webhooks",               name: "Webhooks",            type: "boolean", unit: "",        resetPeriod: "never",    description: "Outgoing webhooks" },
  { key: "custom_domain",          name: "Custom Domain",       type: "boolean", unit: "",        resetPeriod: "never",    description: "Custom domain for chat widget" },
  { key: "api_requests",           name: "API Requests",        type: "quota",   unit: "request", resetPeriod: "monthly",  description: "Monthly API call quota" },
  { key: "workflow_runs",          name: "Workflow Runs",       type: "quota",   unit: "run",     resetPeriod: "monthly",  description: "Monthly workflow executions" },
  { key: "voice_minutes",          name: "Voice Minutes",       type: "quota",   unit: "minute",  resetPeriod: "monthly",  description: "Monthly voice call minutes" },
  { key: "knowledge_storage_mb",   name: "Knowledge Storage",   type: "storage", unit: "MB",      resetPeriod: "never",    description: "Knowledge base storage" },
  { key: "attachment_storage_mb",  name: "Attachment Storage",  type: "storage", unit: "MB",      resetPeriod: "never",    description: "File attachment storage" }
];

async function main() {
  console.log("🔄 Connecting to database...");
  await connectToDatabase();

  // 1. Upsert FeatureDefinition records
  console.log("📋 Seeding feature definitions...");
  for (const fd of FEATURE_DEFINITIONS) {
    await FeatureDefinition.findOneAndUpdate(
      { key: fd.key },
      { $setOnInsert: { ...fd, isActive: true, sortOrder: 0 } },
      { upsert: true }
    );
  }
  console.log(`   ✅ ${FEATURE_DEFINITIONS.length} feature definitions seeded.`);

  // 2. Update BillingPlan records that have no features yet
  const plans = await BillingPlan.find({}).lean();
  console.log(`📦 Processing ${plans.length} billing plans...`);

  let updated = 0;
  let skipped = 0;

  for (const plan of plans) {
    const existingFeatures = (plan as any).features ?? [];
    if (existingFeatures.length > 0) {
      console.log(`   ⏭  Skipping "${plan.name}" — already has ${existingFeatures.length} features.`);
      skipped++;
      continue;
    }

    // Match plan by name (case-insensitive)
    const planKey = plan.name.toLowerCase();
    const matchedKey = Object.keys(PLAN_FEATURE_MAP).find(k => planKey.includes(k));

    if (!matchedKey) {
      console.log(`   ⚠  No feature map for "${plan.name}" — using aiMessageLimit only.`);
      const aiLimit = (plan as any).aiMessageLimit ?? 0;
      if (aiLimit > 0) {
        await BillingPlan.findByIdAndUpdate((plan as any)._id, {
          $set: {
            features: [{ key: "ai_messages", type: "quota", limit: aiLimit, resetPeriod: "monthly", unit: "message" }],
            version: ((plan as any).version ?? 1) + 1
          }
        });
        updated++;
      }
      continue;
    }

    const features = PLAN_FEATURE_MAP[matchedKey];
    // Override ai_messages limit with actual plan aiMessageLimit if larger
    const aiFeature = features.find(f => f.key === "ai_messages");
    if (aiFeature && (plan as any).aiMessageLimit > 0) {
      aiFeature.limit = (plan as any).aiMessageLimit;
    }

    await BillingPlan.findByIdAndUpdate((plan as any)._id, {
      $set: {
        features,
        slug: plan.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        version: 1
      }
    });

    console.log(`   ✅ Updated "${plan.name}" → ${features.length} features added.`);
    updated++;
  }

  console.log(`\n✨ Done! Updated: ${updated}, Skipped (already migrated): ${skipped}`);
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
