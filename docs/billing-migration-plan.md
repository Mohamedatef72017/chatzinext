# ChatZi — Billing Migration Plan

## What Changed

The billing system was refactored from a hardcoded AI-message-only system
to a generic, feature-based billing platform.

### Before

- `BillingPlan.aiMessageLimit` was the only plan-level limit
- `PLAN_DEFAULTS` dictionary in `entitlements.ts` controlled all other features
- Adding a new billable feature required editing 4-6 core files
- `quota.ts` was hardcoded to `ai_messages` only
- Stripe was imported directly throughout `billing.ts`

### After

- `BillingPlan.features[]` is the single source of truth
- `PLAN_DEFAULTS` is kept only as a migration fallback
- Adding a new feature requires only: seed DB record + call `reserveUsage()`
- `usage-engine.ts` handles any feature key generically
- `stripeProvider` implements `PaymentProvider` interface

---

## Migration Steps

### Step 1 — Run the seed script (required, one-time)

```bash
ts-node -r tsconfig-paths/register \
  --compiler-options '{"module":"commonjs","moduleResolution":"node"}' \
  scripts/seed-plan-features.ts
```

This script:
1. Creates `FeatureDefinition` records for all known features
2. Migrates existing `BillingPlan` records to have `features[]` arrays
3. Derives feature limits from `aiMessageLimit` where possible
4. Is idempotent (safe to run multiple times)

### Step 2 — Verify in Admin Panel

1. Go to Admin → Billing
2. Each plan should show its feature count
3. Plans with "⚠ لا توجد ميزات" warning need manual feature assignment

### Step 3 — Monitor usage (optional)

After seeding, Redis quota keys will auto-migrate:
- The new `usage:ai_messages:{tenantId}:{YYYY-MM}` key format is identical
- Existing `TenantSubscription.usedMessages` continues to sync

---

## Backward Compatibility

All existing function signatures are preserved:

| Function | Status | Notes |
|---|---|---|
| `assertAndReserveQuota(tenantId)` | ✅ Works | Now calls `reserveUsage("ai_messages")` |
| `assertCanSendAiMessage(tenantId)` | ✅ Works | Legacy fallback path |
| `recordAiMessageUsage(tenantId)` | ✅ Works | Legacy path, still updates Mongo |
| `getBillingCatalog(tenantId)` | ✅ Works | Now includes `features[]` in response |
| `createStripeCheckout(input)` | ✅ Works | Now via `stripeProvider` |
| `handleStripeEvent(event)` | ✅ Works | Unchanged externally |
| `getEntitlement(tenantId, key)` | ✅ Works | Now reads from plan features |
| `assertEntitlement(tenantId, key)` | ✅ Works | Now calls `assertFeature()` |
| `seedEntitlementsForPlan(...)` | ✅ Works | Kept for legacy Entitlement table |
| `setEntitlementOverride(...)` | ✅ Works | Still writes to Entitlement collection |

---

## New Models Added

| Model | Purpose |
|---|---|
| `FeatureDefinition` | Global registry of billable features |
| `UsageRecord` | Per-tenant per-feature usage in MongoDB |
| `SubscriptionHistory` | Immutable lifecycle transition log |
| `BillingAuditLog` | Immutable admin action audit trail |
| `Wallet` | Credit wallet per tenant |
| `WalletTransaction` | Append-only wallet ledger |

---

## Fields Added to Existing Models

### BillingPlan (new fields)
- `slug` — URL-friendly identifier
- `features[]` — embedded PlanFeature array ← **main addition**
- `version` — bumped on every feature change
- `isArchived` — soft-delete for retired plans
- `isHidden` — hide from public catalog
- `isCustom` — tenant-specific custom plan
- `providerPriceId`, `providerProductId` — provider-agnostic references

### TenantSubscription (new fields)
- `provider` — which payment provider ("stripe", "paymob", etc.)
- `providerCustomerId`, `providerSubscriptionId` — provider-agnostic references
- `currentPeriodStart` — start of current billing period
- `trialEndsAt` — trial expiration date
- `graceEndsAt` — grace period expiration
- `cancelAtPeriodEnd` — scheduled cancellation flag
- `planSnapshot` — frozen plan features at subscription time

---

## Remaining Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Plans without features[] after seed | High | Run seed script; admin panel shows warning |
| Redis down during metering | Medium | Fail-open for paid plans, fail-closed for free |
| Stripe webhook replay | Low | `PaymentEvent.stripeEventId` unique index |
| Wallet balance race condition | Low | MongoDB atomic `$inc` operations |
| `recordAiMessageUsage` + `reserveUsage` called together | Medium | Code comment warns against this; monitor logs |

---

## Next Steps (Recommended)

1. **Run seed script** against production database
2. **Add Free Trial support** — set `trialEndsAt` at registration + cron job to expire
3. **Add Grace Period cron** — check `past_due` → set `graceEndsAt` → block after expiry
4. **Add Dunning management** — retry logic + notification emails on payment failure
5. **Add Token Billing** — create `ai_tokens_prompt` + `ai_tokens_completion` features, capture token counts from AI provider responses
6. **Add Paymob / MyFatoorah** — implement `PaymentProvider` interface
7. **Expose wallet UI** to tenants for credit top-up
8. **Add coupon/discount system** — `Coupon` model + apply at checkout
