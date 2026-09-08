import { promises as fs } from "fs";
import path from "path";
import { nanoid } from "nanoid";
import type { FunnelEvent, Submission, SubmissionStatus } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "submissions.json");

type StoreShape = {
  submissions: Record<string, Submission>;
};

async function ensureStore(): Promise<StoreShape> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await fs.readFile(STORE_FILE, "utf8");
    return JSON.parse(raw) as StoreShape;
  } catch {
    const empty: StoreShape = { submissions: {} };
    await fs.writeFile(STORE_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
}

async function writeStore(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

export async function createSubmission(
  partial?: Partial<Submission>,
): Promise<Submission> {
  const store = await ensureStore();
  const now = new Date().toISOString();
  const submission: Submission = {
    id: partial?.id ?? nanoid(16),
    createdAt: now,
    updatedAt: now,
    status: partial?.status ?? "pending_payment",
    email: partial?.email ?? null,
    name: partial?.name ?? null,
    phone: partial?.phone ?? null,
    stripeSessionId: partial?.stripeSessionId ?? null,
    answers: partial?.answers ?? {},
    scoring: partial?.scoring ?? null,
    clientReportToken: partial?.clientReportToken ?? null,
    advisorReportToken: partial?.advisorReportToken ?? null,
    report: partial?.report ?? null,
    advisorIntel: partial?.advisorIntel ?? null,
    reportEmailSentAt: partial?.reportEmailSentAt ?? null,
    events: partial?.events ?? [],
  };
  store.submissions[submission.id] = submission;
  await writeStore(store);
  return submission;
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const store = await ensureStore();
  return store.submissions[id] ?? null;
}

export async function getByStripeSession(
  sessionId: string,
): Promise<Submission | null> {
  const store = await ensureStore();
  return (
    Object.values(store.submissions).find(
      (s) => s.stripeSessionId === sessionId,
    ) ?? null
  );
}

export async function getByClientToken(
  token: string,
): Promise<Submission | null> {
  const store = await ensureStore();
  return (
    Object.values(store.submissions).find(
      (s) => s.clientReportToken === token,
    ) ?? null
  );
}

export async function getByAdvisorToken(
  token: string,
): Promise<Submission | null> {
  const store = await ensureStore();
  return (
    Object.values(store.submissions).find(
      (s) => s.advisorReportToken === token,
    ) ?? null
  );
}

export async function updateSubmission(
  id: string,
  patch: Partial<Submission>,
): Promise<Submission> {
  const store = await ensureStore();
  const existing = store.submissions[id];
  if (!existing) throw new Error(`Submission ${id} not found`);
  const updated: Submission = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };
  store.submissions[id] = updated;
  await writeStore(store);
  return updated;
}

export async function appendEvent(
  id: string,
  name: string,
  meta?: Record<string, unknown>,
): Promise<Submission> {
  const store = await ensureStore();
  const existing = store.submissions[id];
  if (!existing) throw new Error(`Submission ${id} not found`);
  const event: FunnelEvent = {
    name,
    at: new Date().toISOString(),
    meta,
  };
  const updated: Submission = {
    ...existing,
    events: [...existing.events, event],
    updatedAt: event.at,
  };
  store.submissions[id] = updated;
  await writeStore(store);
  return updated;
}

export async function setStatus(
  id: string,
  status: SubmissionStatus,
): Promise<Submission> {
  return updateSubmission(id, { status });
}
