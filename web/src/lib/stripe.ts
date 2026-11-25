import Stripe from "stripe";

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

export function isDevBypassPayment(): boolean {
  return (
    process.env.DEV_BYPASS_PAYMENT === "true" ||
    !process.env.STRIPE_SECRET_KEY
  );
}

/**
 * Paid Stripe Checkout is dormant by default.
 * Set ENABLE_STRIPE_CHECKOUT=true (+ Stripe keys) to re-enable the $9 path.
 */
export function isStripeCheckoutEnabled(): boolean {
  return (
    process.env.ENABLE_STRIPE_CHECKOUT === "true" &&
    Boolean(process.env.STRIPE_SECRET_KEY?.trim())
  );
}

/** Primary product path: free lead → quiz (no payment). */
export function isFreeDiagnosticFlow(): boolean {
  return !isStripeCheckoutEnabled() || isDevBypassPayment();
}

export const DIAGNOSTIC_PRICE_USD = 900; // $9.00 in cents

/** Live/test Price ID from Stripe product (e.g. Create Nation Diagnostics). */
export function getStripePriceId(): string | null {
  return process.env.STRIPE_PRICE_ID?.trim() || null;
}
