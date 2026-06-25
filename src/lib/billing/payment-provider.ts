/**
 * payment-provider.ts
 *
 * Payment provider abstraction interface.
 * Business logic in billing.ts should call PaymentProvider methods —
 * never import Stripe directly.  This allows adding Paymob, MyFatoorah,
 * Paddle, etc. without touching billing business logic.
 */

export interface CheckoutInput {
  tenantId: string;
  userId: string;
  email?: string | null;
  kind: "plan" | "pack";
  itemId: string;
  planName?: string;
  planDescription?: string;
  priceCents: number;
  currency: string;
  interval?: "month" | "year";
  providerPriceId?: string;
  successUrl: string;
  cancelUrl: string;
  metadata: Record<string, string>;
}

export interface CheckoutResult {
  url: string;
  sessionId: string;
}

export interface PortalInput {
  providerCustomerId: string;
  returnUrl: string;
}

export interface PortalResult {
  url: string;
}

export interface CancelInput {
  providerSubscriptionId: string;
  immediately?: boolean;
}

export interface UpdateSubscriptionInput {
  providerSubscriptionId: string;
  newProviderPriceId: string;
}

export interface WebhookInput {
  rawBody: string;
  signature: string;
  secret: string;
}

export interface ProviderWebhookEvent {
  id: string;
  type: string;
  data: unknown;
  raw: unknown;
}

export interface SubscriptionState {
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  providerSubscriptionId: string;
  providerCustomerId: string;
}

export interface PaymentProvider {
  readonly name: string;
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult>;
  createPortalSession(input: PortalInput): Promise<PortalResult>;
  cancelSubscription(input: CancelInput): Promise<void>;
  updateSubscription(input: UpdateSubscriptionInput): Promise<void>;
  verifyWebhook(input: WebhookInput): Promise<ProviderWebhookEvent>;
  retrieveSubscription(providerSubscriptionId: string): Promise<SubscriptionState>;
}
