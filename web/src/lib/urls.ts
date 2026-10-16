function normalizeBase(raw: string): string {
  return raw.trim().replace(/\/$/, "");
}

/**
 * Public site origin for Stripe success/cancel URLs and email links.
 * Prefer APP_URL; fall back to Vercel deployment URL so live never uses localhost.
 */
export function siteOrigin(): string {
  const explicit =
    process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (explicit) {
    const base = normalizeBase(explicit);
    if (/^https?:\/\//i.test(base)) return base;
    return `https://${base}`;
  }

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) {
    return normalizeBase(
      /^https?:\/\//i.test(vercel) ? vercel : `https://${vercel}`,
    );
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return normalizeBase(
      /^https?:\/\//i.test(vercelUrl) ? vercelUrl : `https://${vercelUrl}`,
    );
  }

  return "http://localhost:3000";
}

export function absoluteUrl(path: string, origin?: string): string {
  const base = normalizeBase(origin || siteOrigin());
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function bookingUrl(): string {
  return (
    process.env.GHL_BOOKING_URL ??
    process.env.NEXT_PUBLIC_GHL_BOOKING_URL ??
    "https://create-nation.com/#contact"
  );
}
