import type { ScoringResult, Submission } from "./types";

/**
 * GoHighLevel integration.
 *
 * Configure:
 * - GHL_API_KEY + GHL_LOCATION_ID (+ GHL_EMAIL_FROM to send report emails)
 * - and/or GHL_WEBHOOK_URL for inbound workflow triggers
 */

export type GhlPayload = {
  event: string;
  submission_id: string;
  email: string | null;
  name: string | null;
  fields: Record<string, string | number | null>;
  contactFacingSafe: boolean;
};

const CLOSER_ONLY_KEYS = new Set([
  "cnm_diag_confidence",
  "cnm_diag_band",
  "cnm_diag_urgency",
  "cnm_diag_objection",
  "cnm_diag_spend",
  "cnm_diag_team",
  "cnm_diag_dims",
  "cnm_diag_advisor_url",
]);

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-04-15";

export function isGhlApiConfigured(): boolean {
  return Boolean(process.env.GHL_API_KEY && process.env.GHL_LOCATION_ID);
}

export function isGhlEmailConfigured(): boolean {
  return isGhlApiConfigured() && Boolean(process.env.GHL_EMAIL_FROM);
}

export function buildGhlFields(
  submission: Submission,
  scoring: ScoringResult,
  urls: { client: string; advisor: string },
): Record<string, string | number | null> {
  return {
    cnm_diag_stage: scoring.stageName,
    cnm_diag_confidence: scoring.confidence,
    cnm_diag_band: scoring.band,
    cnm_diag_urgency: scoring.urgency,
    cnm_diag_objection: scoring.objection,
    cnm_diag_spend: scoring.spend,
    cnm_diag_team: scoring.team,
    cnm_diag_dims: JSON.stringify(scoring.dimensions),
    cnm_diag_report_url: urls.client,
    cnm_diag_advisor_url: urls.advisor,
    cnm_diag_cta: scoring.cta,
    cnm_diag_submission_id: submission.id,
  };
}

export function stripCloserOnly(
  fields: Record<string, string | number | null>,
): Record<string, string | number | null> {
  return Object.fromEntries(
    Object.entries(fields).filter(([k]) => !CLOSER_ONLY_KEYS.has(k)),
  );
}

function customFieldMap(): Record<string, string> {
  const raw = process.env.GHL_CUSTOM_FIELD_IDS;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    console.error("[GHL] GHL_CUSTOM_FIELD_IDS is not valid JSON");
    return {};
  }
}

function toCustomFields(
  fields: Record<string, string | number | null>,
): Array<{ id?: string; key?: string; field_value: string }> {
  const idMap = customFieldMap();
  return Object.entries(fields)
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([key, value]) => {
      const fieldValue = String(value);
      const id = idMap[key];
      if (id) return { id, field_value: fieldValue };
      return { key, field_value: fieldValue };
    });
}

async function ghlFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 0, data: null, error: "GHL_API_KEY missing" };
  }

  try {
    const res = await fetch(`${GHL_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: GHL_VERSION,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    const text = await res.text();
    let data: T | null = null;
    try {
      data = text ? (JSON.parse(text) as T) : null;
    } catch {
      data = null;
    }
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        data,
        error: text.slice(0, 800) || res.statusText,
      };
    }
    return { ok: true, status: res.status, data };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err instanceof Error ? err.message : "GHL request failed",
    };
  }
}

export async function upsertGhlContact(input: {
  email: string;
  name?: string | null;
  phone?: string | null;
  tags?: string[];
  fields?: Record<string, string | number | null>;
}): Promise<{ contactId: string | null; error?: string }> {
  const locationId = process.env.GHL_LOCATION_ID;
  if (!locationId) {
    return { contactId: null, error: "GHL_LOCATION_ID missing" };
  }

  const body: Record<string, unknown> = {
    locationId,
    email: input.email,
    source: "CNM Growth Diagnostic",
  };

  if (input.name) body.name = input.name;
  if (input.phone) body.phone = input.phone;
  if (input.tags?.length) body.tags = input.tags;
  if (input.fields) {
    const customFields = toCustomFields(input.fields);
    if (customFields.length) body.customFields = customFields;
  }

  const result = await ghlFetch<{
    contact?: { id?: string };
    id?: string;
  }>("/contacts/upsert", {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!result.ok) {
    console.error("[GHL] upsert failed", result.status, result.error);
    return { contactId: null, error: result.error };
  }

  const contactId =
    result.data?.contact?.id ?? result.data?.id ?? null;
  return { contactId };
}

export async function sendGhlEmail(input: {
  contactId: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: string[];
}): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  const emailFrom = process.env.GHL_EMAIL_FROM;
  if (!emailFrom) {
    return { sent: false, error: "GHL_EMAIL_FROM missing" };
  }

  const attachments =
    input.attachments?.filter((url) => Boolean(url.trim())) ?? [];

  // Prefer official Conversations send endpoint; fall back to /outbound shape.
  const primary = await ghlFetch<{
    messageId?: string;
    conversationId?: string;
  }>("/conversations/messages", {
    method: "POST",
    body: JSON.stringify({
      type: "Email",
      contactId: input.contactId,
      emailFrom,
      emailTo: input.to,
      subject: input.subject,
      html: input.html,
      message: input.text ?? input.subject,
      ...(attachments.length ? { attachments } : {}),
    }),
  });

  if (primary.ok) {
    return { sent: true, messageId: primary.data?.messageId };
  }

  const fallback = await ghlFetch<{
    messageId?: string;
  }>("/conversations/messages/outbound", {
    method: "POST",
    body: JSON.stringify({
      type: "Email",
      contactId: input.contactId,
      emailFrom,
      emailTo: input.to,
      emailSubject: input.subject,
      emailBody: input.html,
      ...(attachments.length ? { attachments } : {}),
    }),
  });

  if (fallback.ok) {
    return { sent: true, messageId: fallback.data?.messageId };
  }

  console.error(
    "[GHL] email send failed",
    primary.status,
    primary.error,
    fallback.status,
    fallback.error,
  );
  return {
    sent: false,
    error: fallback.error || primary.error || "GHL email send failed",
  };
}

export async function pushToGhl(payload: GhlPayload): Promise<void> {
  console.info("[GHL]", payload.event, payload.email, payload.submission_id);

  if (payload.email && isGhlApiConfigured()) {
    const upsert = await upsertGhlContact({
      email: payload.email,
      name: payload.name,
      tags:
        payload.event === "purchase_completed"
          ? ["Paid - Diagnostic"]
          : payload.event === "client_report_ready"
            ? ["Diagnostic Report Ready"]
            : undefined,
      fields: payload.fields,
    });
    if (upsert.error) {
      console.error("[GHL] contact sync failed", upsert.error);
    }
  }

  const url = process.env.GHL_WEBHOOK_URL;
  if (!url) return;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[GHL] webhook failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("[GHL] webhook failed", err);
  }
}
