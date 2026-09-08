import { promises as fs } from "fs";
import path from "path";
import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import type { FunnelEvent, Submission, SubmissionStatus } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_FILE = path.join(DATA_DIR, "submissions.json");

type StoreShape = {
  submissions: Record<string, Submission>;
};

function redisClient(): Redis | null {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function submissionKey(id: string) {
  return `cnm:submission:${id}`;
}
function stripeKey(sessionId: string) {
  return `cnm:stripe:${sessionId}`;
}
function clientTokenKey(token: string) {
  return `cnm:client:${token}`;
}
function advisorTokenKey(token: string) {
  return `cnm:advisor:${token}`;
}

function requireDurableStoreOnVercel() {
  if (process.env.VERCEL && !redisClient()) {
    throw new Error(
      "Missing Redis storage. In Vercel, add Upstash Redis / KV and set KV_REST_API_URL + KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN).",
    );
  }
}

async function ensureFileStore(): Promise<StoreShape> {
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

async function writeFileStore(store: StoreShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_FILE, JSON.stringify(store, null, 2));
}

async function saveSubmission(submission: Submission): Promise<Submission> {
  const redis = redisClient();
  if (redis) {
    await redis.set(submissionKey(submission.id), submission);
    if (submission.stripeSessionId) {
      await redis.set(stripeKey(submission.stripeSessionId), submission.id);
    }
    if (submission.clientReportToken) {
      await redis.set(clientTokenKey(submission.clientReportToken), submission.id);
    }
    if (submission.advisorReportToken) {
      await redis.set(
        advisorTokenKey(submission.advisorReportToken),
        submission.id,
      );
    }
    return submission;
  }

  requireDurableStoreOnVercel();
  const store = await ensureFileStore();
  store.submissions[submission.id] = submission;
  await writeFileStore(store);
  return submission;
}

export async function createSubmission(
  partial?: Partial<Submission>,
): Promise<Submission> {
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
  return saveSubmission(submission);
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const redis = redisClient();
  if (redis) {
    return (await redis.get<Submission>(submissionKey(id))) ?? null;
  }
  requireDurableStoreOnVercel();
  const store = await ensureFileStore();
  return store.submissions[id] ?? null;
}

export async function getByStripeSession(
  sessionId: string,
): Promise<Submission | null> {
  const redis = redisClient();
  if (redis) {
    const id = await redis.get<string>(stripeKey(sessionId));
    if (!id) return null;
    return getSubmission(id);
  }
  requireDurableStoreOnVercel();
  const store = await ensureFileStore();
  return (
    Object.values(store.submissions).find(
      (s) => s.stripeSessionId === sessionId,
    ) ?? null
  );
}

export async function getByClientToken(
  token: string,
): Promise<Submission | null> {
  const redis = redisClient();
  if (redis) {
    const id = await redis.get<string>(clientTokenKey(token));
    if (!id) return null;
    return getSubmission(id);
  }
  requireDurableStoreOnVercel();
  const store = await ensureFileStore();
  return (
    Object.values(store.submissions).find(
      (s) => s.clientReportToken === token,
    ) ?? null
  );
}

export async function getByAdvisorToken(
  token: string,
): Promise<Submission | null> {
  const redis = redisClient();
  if (redis) {
    const id = await redis.get<string>(advisorTokenKey(token));
    if (!id) return null;
    return getSubmission(id);
  }
  requireDurableStoreOnVercel();
  const store = await ensureFileStore();
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
  const existing = await getSubmission(id);
  if (!existing) throw new Error(`Submission ${id} not found`);
  const updated: Submission = {
    ...existing,
    ...patch,
    id: existing.id,
    updatedAt: new Date().toISOString(),
  };
  return saveSubmission(updated);
}

export async function appendEvent(
  id: string,
  name: string,
  meta?: Record<string, unknown>,
): Promise<Submission> {
  const existing = await getSubmission(id);
  if (!existing) throw new Error(`Submission ${id} not found`);
  const event: FunnelEvent = {
    name,
    at: new Date().toISOString(),
    meta,
  };
  return saveSubmission({
    ...existing,
    events: [...existing.events, event],
    updatedAt: event.at,
  });
}

export async function setStatus(
  id: string,
  status: SubmissionStatus,
): Promise<Submission> {
  return updateSubmission(id, { status });
}
