import type Stripe from "stripe";
import type { Submission } from "@/lib/types";
import { isTrackingDisabled } from "@/lib/runtime-flags";
import { hashEmail, hashPhone } from "./hash";
import {
  purchaseEventId,
  type MetaCapiPurchaseDelivery,
} from "./capi-types";
import {
  acquireProcessingLock,
  createPendingDelivery,
  getDelivery,
  listDueDeliveries,
  releaseProcessingLock,
  saveDelivery,
} from "./capi-delivery-store";

const DEFAULT_PIXEL_ID = "1333277422099707";
const DEFAULT_GRAPH_VERSION = "v21.0";
const LOCK_TTL_SEC = 90;
const MAX_ATTEMPTS = 12;

function pixelId(): string {
  // Never fall back to the production dataset when tracking is disabled.
  if (isTrackingDisabled()) return "";
  return (
    process.env.META_PIXEL_ID?.trim() ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() ||
    DEFAULT_PIXEL_ID
  );
}

function graphVersion(): string {
  return process.env.META_GRAPH_API_VERSION?.trim() || DEFAULT_GRAPH_VERSION;
}

function accessToken(): string | null {
  return process.env.META_CAPI_ACCESS_TOKEN?.trim() || null;
}

function testEventCode(): string | null {
  return process.env.META_CAPI_TEST_EVENT_CODE?.trim() || null;
}

function backoffMs(attempts: number): number {
  // 1m, 2m, 5m, 15m, 30m, then hourly-ish
  const mins = [1, 2, 5, 15, 30, 60, 120, 240, 480, 720, 1440];
  const idx = Math.min(Math.max(attempts - 1, 0), mins.length - 1);
  return mins[idx] * 60_000;
}

function stripeValueMajor(
  amountTotal: number | null | undefined,
  currency: string | null | undefined,
): { value: number; currency: string } {
  const cur = (currency || "usd").toLowerCase();
  const cents = typeof amountTotal === "number" ? amountTotal : 900;
  return { value: cents / 100, currency: cur };
}

export type StripePaidSession = Pick<
  Stripe.Checkout.Session,
  "id" | "amount_total" | "currency" | "created" | "payment_status" | "status"
>;

function isSessionPaid(session: StripePaidSession): boolean {
  return (
    session.payment_status === "paid" || session.status === "complete"
  );
}

function buildDraft(input: {
  session: StripePaidSession;
  submission: Submission;
  eventTime: number;
}): MetaCapiPurchaseDelivery {
  const { value, currency } = stripeValueMajor(
    input.session.amount_total,
    input.session.currency,
  );
  const now = new Date().toISOString();
  const eventId = purchaseEventId(input.session.id);
  return {
    eventId,
    eventName: "Purchase",
    sessionId: input.session.id,
    submissionId: input.submission.id,
    status: "pending",
    eventTime: input.eventTime,
    value,
    currency,
    emailHash: input.submission.email
      ? hashEmail(input.submission.email)
      : null,
    phoneHash: input.submission.phone
      ? hashPhone(input.submission.phone)
      : null,
    clientUserAgent: input.submission.clientUserAgent ?? null,
    clientEventSourceUrl: input.submission.clientEventSourceUrl ?? null,
    fbp: input.submission.clientFbp ?? null,
    fbc: input.submission.clientFbc ?? null,
    attempts: 0,
    lastError: null,
    createdAt: now,
    updatedAt: now,
    sentAt: null,
    nextAttemptAt: Date.now(),
  };
}

async function sendPurchaseToMeta(
  delivery: MetaCapiPurchaseDelivery,
): Promise<{ ok: boolean; error?: string }> {
  const token = accessToken();
  if (!token) {
    return { ok: false, error: "META_CAPI_ACCESS_TOKEN missing" };
  }

  const userData: Record<string, unknown> = {};
  if (delivery.emailHash) userData.em = [delivery.emailHash];
  if (delivery.phoneHash) userData.ph = [delivery.phoneHash];
  if (delivery.clientUserAgent) {
    userData.client_user_agent = delivery.clientUserAgent;
  }
  if (delivery.fbp) userData.fbp = delivery.fbp;
  if (delivery.fbc) userData.fbc = delivery.fbc;

  const event: Record<string, unknown> = {
    event_name: "Purchase",
    event_time: delivery.eventTime,
    event_id: delivery.eventId,
    action_source: "website",
    user_data: userData,
    custom_data: {
      currency: delivery.currency,
      value: delivery.value,
      content_name: "Create Nation Diagnostics",
      content_type: "product",
    },
  };
  if (delivery.clientEventSourceUrl) {
    event.event_source_url = delivery.clientEventSourceUrl;
  }

  const body: Record<string, unknown> = {
    data: [event],
    access_token: token,
  };
  const testCode = testEventCode();
  if (testCode) body.test_event_code = testCode;

  const url = `https://graph.facebook.com/${graphVersion()}/${pixelId()}/events`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: { error?: { message?: string }; events_received?: number } = {};
  try {
    json = text ? (JSON.parse(text) as typeof json) : {};
  } catch {
    // ignore
  }

  if (!res.ok) {
    return {
      ok: false,
      error: json.error?.message || text.slice(0, 300) || `HTTP ${res.status}`,
    };
  }
  return { ok: true };
}

/**
 * Claim lock → send → mark sent (or failed + schedule retry).
 * Safe under concurrency; no-ops if already sent or lock held.
 */
export async function processMetaPurchaseDelivery(
  eventId: string,
): Promise<{ status: string; error?: string }> {
  const current = await getDelivery(eventId);
  if (!current) return { status: "missing" };
  if (current.status === "sent") return { status: "already_sent" };
  if (current.attempts >= MAX_ATTEMPTS) {
    return { status: "max_attempts", error: current.lastError ?? undefined };
  }

  const locked = await acquireProcessingLock(eventId, LOCK_TTL_SEC);
  if (!locked) return { status: "locked" };

  try {
    const again = await getDelivery(eventId);
    if (!again || again.status === "sent") return { status: "already_sent" };

    const processing: MetaCapiPurchaseDelivery = {
      ...again,
      status: "processing",
      updatedAt: new Date().toISOString(),
    };
    await saveDelivery(processing);

    const result = await sendPurchaseToMeta(processing);
    if (result.ok) {
      const sent: MetaCapiPurchaseDelivery = {
        ...processing,
        status: "sent",
        attempts: processing.attempts + 1,
        lastError: null,
        sentAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        nextAttemptAt: Date.now(),
      };
      await saveDelivery(sent);
      return { status: "sent" };
    }

    const attempts = processing.attempts + 1;
    const failed: MetaCapiPurchaseDelivery = {
      ...processing,
      status: "failed",
      attempts,
      lastError: result.error ?? "send failed",
      updatedAt: new Date().toISOString(),
      nextAttemptAt: Date.now() + backoffMs(attempts),
    };
    await saveDelivery(failed);
    return { status: "failed", error: result.error };
  } finally {
    await releaseProcessingLock(eventId);
  }
}

/**
 * Shared enqueue used by Stripe webhook + confirm-checkout after paid verification.
 * Never throws to callers — Meta outages must not block paid/GHL/quiz.
 */
export async function enqueueMetaPurchase(input: {
  session: StripePaidSession;
  submission: Submission;
}): Promise<{ eventId: string; outcome: string; error?: string }> {
  try {
    if (isTrackingDisabled()) {
      return {
        eventId: purchaseEventId(input.session.id),
        outcome: "skipped_tracking_disabled",
      };
    }
    if (!isSessionPaid(input.session)) {
      return { eventId: "", outcome: "not_paid" };
    }
    if (!accessToken()) {
      console.warn("[meta-capi] META_CAPI_ACCESS_TOKEN not set — skip enqueue");
      return {
        eventId: purchaseEventId(input.session.id),
        outcome: "skipped_no_token",
      };
    }

    const eventId = purchaseEventId(input.session.id);
    const existing = await getDelivery(eventId);
    if (existing?.status === "sent") {
      return { eventId, outcome: "already_sent" };
    }

    const eventTime =
      existing?.eventTime ??
      (typeof input.session.created === "number"
        ? input.session.created
        : Math.floor(Date.now() / 1000));

    const draft = buildDraft({
      session: input.session,
      submission: input.submission,
      eventTime,
    });

    // Preserve original eventTime / createdAt if record already exists (pending/failed).
    if (existing) {
      draft.eventTime = existing.eventTime;
      draft.createdAt = existing.createdAt;
      draft.attempts = existing.attempts;
      draft.status = "pending";
      draft.nextAttemptAt = Date.now();
      draft.updatedAt = new Date().toISOString();
      await saveDelivery(draft);
    } else {
      await createPendingDelivery(draft);
    }

    const processed = await processMetaPurchaseDelivery(eventId);
    return { eventId, outcome: processed.status, error: processed.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : "enqueue failed";
    console.error("[meta-capi] enqueue error", message);
    return {
      eventId: purchaseEventId(input.session.id),
      outcome: "error",
      error: message,
    };
  }
}

/** Durable retry worker entrypoint. */
export async function retryDueMetaPurchases(limit = 20): Promise<{
  processed: number;
  results: Array<{ eventId: string; status: string; error?: string }>;
}> {
  const due = await listDueDeliveries(limit);
  const results: Array<{ eventId: string; status: string; error?: string }> =
    [];
  for (const d of due) {
    const r = await processMetaPurchaseDelivery(d.eventId);
    results.push({ eventId: d.eventId, status: r.status, error: r.error });
  }
  return { processed: results.length, results };
}
