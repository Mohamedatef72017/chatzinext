/**
 * stripe.provider.ts
 *
 * Stripe implementation of the PaymentProvider interface.
 * All Stripe-specific logic lives here — billing.ts stays provider-agnostic.
 */

import Stripe from "stripe";
import type {
  PaymentProvider,
  CheckoutInput,
  CheckoutResult,
  PortalInput,
  PortalResult,
  CancelInput,
  UpdateSubscriptionInput,
  WebhookInput,
  ProviderWebhookEvent,
  SubscriptionState
} from "../payment-provider";

function makeStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is required.");
  if (!key.startsWith("sk_test_") && !key.startsWith("sk_live_")) {
    throw new Error(
      "STRIPE_SECRET_KEY is invalid: key must start with sk_test_ or sk_live_. " +
      "Verify that the correct Stripe secret key is configured in environment variables. " +
      `Current key prefix: ${key.slice(0, 8)}...`
    );
  }
  return new Stripe(key);
}

export class StripePaymentProvider implements PaymentProvider {
  readonly name = "stripe";

  async createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
    const stripe = makeStripe();
    const mode = input.kind === "plan" ? "subscription" : "payment";

    let lineItem: Stripe.Checkout.SessionCreateParams.LineItem;

    if (input.providerPriceId) {
      lineItem = { price: input.providerPriceId, quantity: 1 };
    } else {
      lineItem = {
        price_data: {
          currency: input.currency,
          product_data: {
            name: input.planName ?? input.itemId,
            description: input.planDescription
          },
          unit_amount: input.priceCents,
          ...(input.kind === "plan" && input.interval
            ? { recurring: { interval: input.interval } }
            : {})
        },
        quantity: 1
      };
    }

    const session = await stripe.checkout.sessions.create({
      mode,
      customer_email: input.email ?? undefined,
      client_reference_id: input.tenantId,
      line_items: [lineItem],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      metadata: input.metadata,
      subscription_data:
        input.kind === "plan"
          ? { metadata: { tenantId: input.tenantId, planId: input.itemId } }
          : undefined
    });

    return { url: session.url!, sessionId: session.id };
  }

  async createPortalSession(input: PortalInput): Promise<PortalResult> {
    const stripe = makeStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: input.providerCustomerId,
      return_url: input.returnUrl
    });
    return { url: session.url };
  }

  async cancelSubscription(input: CancelInput): Promise<void> {
    const stripe = makeStripe();
    if (input.immediately) {
      await stripe.subscriptions.cancel(input.providerSubscriptionId);
    } else {
      await stripe.subscriptions.update(input.providerSubscriptionId, {
        cancel_at_period_end: true
      });
    }
  }

  async updateSubscription(input: UpdateSubscriptionInput): Promise<void> {
    const stripe = makeStripe();
    const subscription = await stripe.subscriptions.retrieve(input.providerSubscriptionId);
    await stripe.subscriptions.update(input.providerSubscriptionId, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: input.newProviderPriceId
        }
      ]
    });
  }

  async verifyWebhook(input: WebhookInput): Promise<ProviderWebhookEvent> {
    const stripe = makeStripe();
    const event = stripe.webhooks.constructEvent(input.rawBody, input.signature, input.secret);
    return {
      id: event.id,
      type: event.type,
      data: event.data.object,
      raw: event
    };
  }

  async retrieveSubscription(providerSubscriptionId: string): Promise<SubscriptionState> {
    const stripe = makeStripe();
    const sub = await stripe.subscriptions.retrieve(providerSubscriptionId);
    const itemPeriodEnd = sub.items.data[0]?.current_period_end;
    const itemPeriodStart = sub.items.data[0]?.current_period_start;
    return {
      status: sub.status,
      currentPeriodStart: itemPeriodStart ? new Date(itemPeriodStart * 1000) : null,
      currentPeriodEnd: itemPeriodEnd ? new Date(itemPeriodEnd * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      providerSubscriptionId: sub.id,
      providerCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id
    };
  }
}

export const stripeProvider = new StripePaymentProvider();
