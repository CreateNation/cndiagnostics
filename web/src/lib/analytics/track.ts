import {
  DIAGNOSTIC_CURRENCY,
  DIAGNOSTIC_PURCHASE_VALUE,
  getAnalyticsIds,
} from "./config";

export type TrackPayload = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      track: (event: string, payload?: TrackPayload) => void;
      page: () => void;
    };
    lintrk?: (action: string, payload?: { conversion_id?: string }) => void;
  }
}

function pushDataLayer(event: string, payload?: TrackPayload) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
}

function gtagEvent(name: string, payload?: TrackPayload) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", name, payload ?? {});
}

function metaEvent(name: string, payload?: TrackPayload) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", name, payload ?? {});
}

function metaCustom(name: string, payload?: TrackPayload) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("trackCustom", name, payload ?? {});
}

function tiktokEvent(name: string, payload?: TrackPayload) {
  if (typeof window === "undefined" || !window.ttq?.track) return;
  window.ttq.track(name, payload ?? {});
}

/** Capture UTMs once and reuse for later events */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const keys = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "gclid",
      "fbclid",
      "ttclid",
    ] as const;
    const found: Record<string, string> = {};
    for (const key of keys) {
      const value = params.get(key);
      if (value) found[key] = value;
    }
    if (Object.keys(found).length) {
      sessionStorage.setItem("cnm_attribution", JSON.stringify(found));
    }
  } catch {
    // ignore
  }
}

export function getAttribution(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem("cnm_attribution");
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function trackPageView(path: string): void {
  const ids = getAnalyticsIds();
  const payload = { page_path: path, page_location: window.location.href };

  pushDataLayer("page_view", payload);

  if (ids.ga4Id || ids.googleAdsId) {
    gtagEvent("page_view", {
      page_path: path,
      page_location: window.location.href,
      send_to: ids.ga4Id || undefined,
    });
  }

  if (ids.metaPixelId) {
    metaEvent("PageView");
  }

  if (ids.tiktokPixelId) {
    window.ttq?.page?.();
  }
}

/**
 * Funnel / marketing events.
 * Fires to GTM dataLayer + native Meta / GA4 / TikTok when configured.
 */
export function track(event: string, payload: TrackPayload = {}): void {
  const ids = getAnalyticsIds();
  const enriched = { ...getAttribution(), ...payload };

  pushDataLayer(event, enriched);

  switch (event) {
    case "checkout_started":
      metaEvent("InitiateCheckout", {
        value: DIAGNOSTIC_PURCHASE_VALUE,
        currency: DIAGNOSTIC_CURRENCY,
        content_name: "CNM Growth Diagnostic",
      });
      gtagEvent("begin_checkout", {
        currency: DIAGNOSTIC_CURRENCY,
        value: DIAGNOSTIC_PURCHASE_VALUE,
        items: [{ item_name: "CNM Growth Diagnostic", price: DIAGNOSTIC_PURCHASE_VALUE, quantity: 1 }],
      });
      tiktokEvent("InitiateCheckout", {
        value: DIAGNOSTIC_PURCHASE_VALUE,
        currency: DIAGNOSTIC_CURRENCY,
      });
      break;

    case "purchase":
      metaEvent("Purchase", {
        value: Number(enriched.value ?? DIAGNOSTIC_PURCHASE_VALUE),
        currency: DIAGNOSTIC_CURRENCY,
        content_name: "CNM Growth Diagnostic",
        content_type: "product",
      });
      gtagEvent("purchase", {
        transaction_id: String(enriched.transaction_id ?? ""),
        value: Number(enriched.value ?? DIAGNOSTIC_PURCHASE_VALUE),
        currency: DIAGNOSTIC_CURRENCY,
        items: [{ item_name: "CNM Growth Diagnostic", price: DIAGNOSTIC_PURCHASE_VALUE, quantity: 1 }],
      });
      if (ids.googleAdsId && process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL) {
        gtagEvent("conversion", {
          send_to: `${ids.googleAdsId}/${process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL}`,
          value: DIAGNOSTIC_PURCHASE_VALUE,
          currency: DIAGNOSTIC_CURRENCY,
          transaction_id: String(enriched.transaction_id ?? ""),
        });
      }
      tiktokEvent("CompletePayment", {
        value: DIAGNOSTIC_PURCHASE_VALUE,
        currency: DIAGNOSTIC_CURRENCY,
      });
      break;

    case "quiz_started":
      metaCustom("QuizStarted", enriched);
      gtagEvent("quiz_started", enriched);
      tiktokEvent("ViewContent", { content_name: "Diagnostic Quiz" });
      break;

    case "quiz_completed":
      metaEvent("Lead", {
        content_name: "Diagnostic Quiz Completed",
        value: DIAGNOSTIC_PURCHASE_VALUE,
        currency: DIAGNOSTIC_CURRENCY,
      });
      metaCustom("QuizCompleted", enriched);
      gtagEvent("generate_lead", {
        currency: DIAGNOSTIC_CURRENCY,
        value: DIAGNOSTIC_PURCHASE_VALUE,
      });
      gtagEvent("quiz_completed", enriched);
      tiktokEvent("SubmitForm", { content_name: "Diagnostic Quiz" });
      break;

    case "report_viewed":
      metaCustom("ReportViewed", enriched);
      gtagEvent("report_viewed", enriched);
      tiktokEvent("ViewContent", { content_name: "Client Report" });
      break;

    case "book_call_clicked":
      metaEvent("Schedule", {
        content_name: String(enriched.source ?? "book_call"),
      });
      metaCustom("BookCallClicked", enriched);
      gtagEvent("book_call_clicked", enriched);
      if (ids.googleAdsId && process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CALL_LABEL) {
        gtagEvent("conversion", {
          send_to: `${ids.googleAdsId}/${process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOK_CALL_LABEL}`,
        });
      }
      tiktokEvent("Contact", { content_name: "Book Consultation" });
      if (typeof window.lintrk === "function" && process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID) {
        window.lintrk("track", {
          conversion_id: process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_ID,
        });
      }
      break;

    default:
      metaCustom(event, enriched);
      gtagEvent(event, enriched);
      break;
  }
}
