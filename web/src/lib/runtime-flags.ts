/**
 * Local / sandbox switches. Prefer shell env or `npm run dev:sandbox`
 * so production Vercel env stays untouched.
 */

function flagTrue(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/** No GTM / pixels / dataLayer / Meta CAPI. */
export function isTrackingDisabled(): boolean {
  return (
    flagTrue("NEXT_PUBLIC_DISABLE_TRACKING") || flagTrue("DISABLE_TRACKING")
  );
}

/** Skip GoHighLevel contact/opportunity sync (and outbound GHL webhooks). */
export function isGhlDisabled(): boolean {
  return flagTrue("DISABLE_GHL");
}

/** True when any sandbox isolation flag is on (for UI banner). */
export function isSandboxMode(): boolean {
  return isTrackingDisabled() || isGhlDisabled();
}
