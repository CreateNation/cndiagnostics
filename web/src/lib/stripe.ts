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

export const DIAGNOSTIC_PRICE_USD = 900; // $9.00 in cents
