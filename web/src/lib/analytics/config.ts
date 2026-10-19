import { isTrackingDisabled } from "@/lib/runtime-flags";

export type AnalyticsIds = {
  gtmId: string | null;
  ga4Id: string | null;
  googleAdsId: string | null;
  metaPixelId: string | null;
  tiktokPixelId: string | null;
  linkedInPartnerId: string | null;
};

export function getAnalyticsIds(): AnalyticsIds {
  if (isTrackingDisabled()) {
    return {
      gtmId: null,
      ga4Id: null,
      googleAdsId: null,
      metaPixelId: null,
      tiktokPixelId: null,
      linkedInPartnerId: null,
    };
  }

  // No hardcoded production defaults — blank env = no tags.
  return {
    gtmId: process.env.NEXT_PUBLIC_GTM_ID?.trim() || null,
    ga4Id: process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || null,
    googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID?.trim() || null,
    metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || null,
    tiktokPixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID?.trim() || null,
    linkedInPartnerId:
      process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID?.trim() || null,
  };
}

export function hasAnyAnalytics(ids: AnalyticsIds = getAnalyticsIds()): boolean {
  if (isTrackingDisabled()) return false;
  return Boolean(
    ids.gtmId ||
      ids.ga4Id ||
      ids.googleAdsId ||
      ids.metaPixelId ||
      ids.tiktokPixelId ||
      ids.linkedInPartnerId,
  );
}

/** Stripe diagnostic price — used for Purchase / conversion value */
export const DIAGNOSTIC_PURCHASE_VALUE = 9;
export const DIAGNOSTIC_CURRENCY = "USD";
