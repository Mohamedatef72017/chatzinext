# ChatZi — Billing Architecture

## Overview

ChatZi uses a **feature-based, configuration-driven billing system**.
Plans define their features directly — no hardcoded defaults exist in business logic.
Adding a new billable feature requires only:

1. Add a `FeatureDefinition` record in the database.
2. Add the feature to the relevant `BillingPlan.features[]` array.
3. Call `reserveUsage(tenantId, featureKey, amount)` in the feature's code path.

No changes to `entitlement-engine.ts`, `usage-engine.ts`, or `quota.ts` are needed.

---

## Directory Structure

```
src/lib/billing/
  feature-registry.ts          # Feature key constants + metadata catalog
  plan-resolver.ts             # Reads BillingPlan.features[] as source of truth
  entitlement-engine.ts        # Checks if a tenant can use a feature
  usage-engine.ts              # Generic Redis+Mongo usage metering
  billing-audit.ts             # Append-only audit log writer
  payment-provider.ts          # PaymentProvider interface
  wallet-service.ts            # Wallet credit/debit/reserve operations
  subscription-history-helper.ts  # Subscription lifecycle history writer
  providers/
    stripe.provider.ts         # Stripe implementation of PaymentProvider
  index.ts                     # Public exports

src/lib/
  billing.ts                   # Public API (backward-compat)
  entitlements.ts              # Backward-compat wrapper for old API
  quota.ts                     # Backward-compat wrapper for old quota API
  stripe.ts                    # Raw Stripe client (legacy, kept for webhook)

src/lib/models/
  billing-plan.ts              # Plan + embedded PlanFeature[]
  tenant-subscription.ts       # Per-tenant subscription state
  feature-definition.ts        # Global feature registry
  usage-record.ts              # Per-tenant per-feature usage in MongoDB
  subscription-history.ts      # Immutable lifecycle log
  billing-audit-log.ts         # Immutable admin action log
  wallet.ts                    # Wallet per tenant
  wallet-transaction.ts        # Wallet transaction ledger
```

---

## Data Model

### BillingPlan

```typescript
{
  name: "Pro",
  slug: "pro",
  interval: "month",
  priceCents: 4900,
  currency: "usd",
  features: [
    { key: "ai_messages",   type: "quota",   limit: 10000, resetPeriod: "monthly" },
    { key: "max_agents",    type: "count",   limit: 25 },
    { key: "advanced_ai",   type: "boolean", enabled: true },
    { key: "white_label",   type: "boolean", enabled: false },
    { key: "knowledge_enabled", type: "boolean", enabled: true }
  ],
  version: 1,
  isActive: true,
  isArchived: false,
  isHidden: false,
  isCustom: false
}
```

`BillingPlan` is the **single source of truth** for what a plan offers.

### TenantSubscription

Tracks the runtime subscription state per tenant. Includes:
- `planId` reference + `planSnapshot` (frozen copy at subscription time)
- `status`: active | inactive | past_due | canceled | trialing
- `trialEndsAt`, `graceEndsAt`, `cancelAtPeriodEnd`
- Legacy `usedMessages` / `monthlyMessageLimit` (backward compat only)

### UsageRecord

```typescript
{
  tenantId, featureKey, periodKey,
  usedAmount, limit, lastSyncedAt
}
```

One document per (tenant, feature, period). Updated from Redis every 10 operations.

### SubscriptionHistory (append-only)

Every subscription state change is logged with: `fromStatus → toStatus`, `transition`, `actor`.

### BillingAuditLog (append-only)

Every admin billing action is logged with: `action`, `before`, `after`, `actorId`.

### Wallet + WalletTransaction (append-only ledger)

```typescript
// Wallet
{ tenantId, balanceCredits, reservedCredits }

// WalletTransaction (every mutation)
{ idempotencyKey, type, amount, balanceBefore, balanceAfter }
```

---

## Entitlement Resolution

Priority (highest to lowest):

1. **Tenant-level Entitlement override** (`Entitlement` collection, `isOverride: true`)
2. **Plan features** (`BillingPlan.features[]`)
3. **Safe default** (disabled / 0)

```typescript
import { assertFeature, isFeatureEnabled, checkFeatureLimit } from "@/lib/billing";

// Block if feature not on plan
await assertFeature(tenantId, "advanced_ai");

// Check if a channel count is under limit
await assertFeature(tenantId, "max_channels", currentChannelCount);

// Read the value
const enabled = await isFeatureEnabled(tenantId, "knowledge_enabled");
```

---

## Usage Metering

```typescript
import { reserveUsage, getFeatureUsage } from "@/lib/billing";

// Before an AI message:
await reserveUsage(tenantId, "ai_messages", 1);

// Before storing a file (MB):
await reserveUsage(tenantId, "knowledge_storage_mb", fileSizeMb);

// Before creating a team member:
await assertFeature(tenantId, "max_team_members", currentMemberCount);

// With idempotency key (prevents double-count on retry):
await reserveUsage(tenantId, "api_requests", 1, { idempotencyKey: requestId });
```

### Hot Path (Redis)

```
[API Request]
     ↓
reserveUsage(tenantId, featureKey, amount)
     ↓
Redis SET NX (bootstrap from MongoDB on first use)
     ↓
Redis INCRBY (atomic)
     ↓
Check: newCount > limit? → DECRBY + throw
     ↓
Every 10 ops: syncToMongo (fire-and-forget)
```

### Failure Modes

| Scenario | Behavior |
|---|---|
| Redis down + free plan (limit ≤ 200) | Fail closed — read MongoDB, block if over limit |
| Redis down + paid plan | Fail open — log error, allow request |
| MongoDB sync fails | Log warning, continue (Redis is source of truth) |

---

## Payment Provider Abstraction

All payment-specific code implements `PaymentProvider`:

```typescript
interface PaymentProvider {
  createCheckoutSession(input): Promise<CheckoutResult>;
  createPortalSession(input): Promise<PortalResult>;
  cancelSubscription(input): Promise<void>;
  updateSubscription(input): Promise<void>;
  verifyWebhook(input): Promise<ProviderWebhookEvent>;
  retrieveSubscription(id): Promise<SubscriptionState>;
}
```

`billing.ts` only calls `stripeProvider.*` methods — no direct Stripe imports.
Adding Paymob or MyFatoorah requires implementing `PaymentProvider` and swapping the provider.

---

## Adding a New Billable Feature

**Example: Adding "Voice Minutes"**

**Step 1:** Feature is already in `FEATURE_KEYS` and `FEATURE_REGISTRY` in `feature-registry.ts`.

**Step 2:** Add to the FeatureDefinition table (one-time seed):
```typescript
await FeatureDefinition.create({
  key: "voice_minutes", name: "Voice Minutes",
  type: "quota", unit: "minute", resetPeriod: "monthly", isActive: true
});
```

**Step 3:** Add to relevant plans via Admin Panel → Plan → Add Feature.

**Step 4:** In voice call code:
```typescript
await reserveUsage(tenantId, "voice_minutes", minutesUsed);
```

**That's it.** No changes to `entitlement-engine.ts`, `usage-engine.ts`, or billing models.

---

## Adding a New Payment Provider

**Example: Adding Paymob**

```typescript
// src/lib/billing/providers/paymob.provider.ts
export class PaymobPaymentProvider implements PaymentProvider {
  readonly name = "paymob";
  async createCheckoutSession(input) { /* Paymob API call */ }
  // ... implement all interface methods
}
```

Then in `billing.ts`, select provider based on tenant config or environment:
```typescript
const provider = tenant.paymentProvider === "paymob" ? paymobProvider : stripeProvider;
```

---

## Admin Capabilities

| Action | API |
|---|---|
| Create plan | `POST /api/admin/billing/plans` |
| Edit plan | `PATCH /api/admin/billing/plans/:id` |
| Clone plan | `POST /api/admin/billing/plans/:id/clone` |
| Archive plan | `DELETE /api/admin/billing/plans/:id` |
| Add/edit feature | `PATCH /api/admin/billing/plans/:id/features` |
| Remove feature | `DELETE /api/admin/billing/plans/:id/features?key=xxx` |
| Grant credits | `POST /api/admin/billing/credits` |
| Override entitlement | `POST /api/admin/billing/entitlements` |
| View audit log | `GET /api/admin/billing/audit` |
| Cancel subscription | `POST /api/admin/subscriptions/cancel` |
| View subscription history | `GET /api/admin/billing/subscriptions/history` |

---

## Security Checklist

- ✅ Stripe webhook signature verified (`webhooks.constructEvent`)
- ✅ Stripe event idempotency (`PaymentEvent.stripeEventId` unique index)
- ✅ Checkout session ownership verified (`sessionTenantId !== tenantId`)
- ✅ All admin endpoints guarded with `requireSuperAdmin()`
- ✅ Input validated with Zod on all API routes
- ✅ Wallet transactions protected against negative balance
- ✅ Wallet idempotency key prevents double-credits
- ✅ Usage INCR is atomic (Redis)
- ✅ Billing audit log on every admin action
- ✅ Tenant isolation: every query filtered by `tenantId`
