/**
 * src/lib/billing/index.ts
 *
 * Public exports for the billing engine.
 * Import from "@/lib/billing" for the new API.
 * The old "@/lib/billing.ts" remains for backward compatibility.
 */

export * from "./feature-registry";
export * from "./plan-resolver";
export * from "./entitlement-engine";
export * from "./usage-engine";
export * from "./billing-audit";
export * from "./payment-provider";
export * from "./wallet-service";
export { stripeProvider } from "./providers/stripe.provider";
