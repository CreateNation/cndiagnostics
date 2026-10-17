import { promises as fs } from "fs";
import path from "path";
import { getRedis } from "@/lib/redis";
import type { MetaCapiPurchaseDelivery } from "./capi-types";

const QUEUE_KEY = "cnm:meta:capi:queue";
const LOCK_PREFIX = "cnm:meta:capi:lock:";
const RECORD_PREFIX = "cnm:meta:capi:purchase:";

const DATA_DIR = path.join(process.cwd(), ".data");
const FILE_STORE = path.join(DATA_DIR, "meta-capi-deliveries.json");

type FileShape = {
  deliveries: Record<string, MetaCapiPurchaseDelivery>;
  queue: string[];
};

function recordKey(eventId: string) {
  return `${RECORD_PREFIX}${eventId}`;
}
function lockKey(eventId: string) {
  return `${LOCK_PREFIX}${eventId}`;
}

async function readFileStore(): Promise<FileShape> {
  try {
    const raw = await fs.readFile(FILE_STORE, "utf8");
    return JSON.parse(raw) as FileShape;
  } catch {
    return { deliveries: {}, queue: [] };
  }
}

async function writeFileStore(store: FileShape): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE_STORE, JSON.stringify(store, null, 2));
}

export async function getDelivery(
  eventId: string,
): Promise<MetaCapiPurchaseDelivery | null> {
  const redis = getRedis();
  if (redis) {
    return (await redis.get<MetaCapiPurchaseDelivery>(recordKey(eventId))) ?? null;
  }
  const store = await readFileStore();
  return store.deliveries[eventId] ?? null;
}

/**
 * Atomically create a pending delivery record.
 * Returns existing record if one already exists (any status).
 */
export async function createPendingDelivery(
  draft: MetaCapiPurchaseDelivery,
): Promise<{ delivery: MetaCapiPurchaseDelivery; created: boolean }> {
  const redis = getRedis();
  if (redis) {
    // SET NX — Upstash returns the value/"OK" on success, null if key exists.
    const created = await redis.set(recordKey(draft.eventId), draft, {
      nx: true,
    });
    if (created != null) {
      await redis.zadd(QUEUE_KEY, {
        score: draft.nextAttemptAt,
        member: draft.eventId,
      });
      return { delivery: draft, created: true };
    }
    const existing = await getDelivery(draft.eventId);
    if (existing) return { delivery: existing, created: false };
    // Race: key vanished — write again
    await redis.set(recordKey(draft.eventId), draft);
    await redis.zadd(QUEUE_KEY, {
      score: draft.nextAttemptAt,
      member: draft.eventId,
    });
    return { delivery: draft, created: true };
  }

  const store = await readFileStore();
  if (store.deliveries[draft.eventId]) {
    return { delivery: store.deliveries[draft.eventId], created: false };
  }
  store.deliveries[draft.eventId] = draft;
  if (!store.queue.includes(draft.eventId)) store.queue.push(draft.eventId);
  await writeFileStore(store);
  return { delivery: draft, created: true };
}

export async function saveDelivery(
  delivery: MetaCapiPurchaseDelivery,
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(recordKey(delivery.eventId), delivery);
    if (delivery.status === "sent") {
      await redis.zrem(QUEUE_KEY, delivery.eventId);
    } else {
      await redis.zadd(QUEUE_KEY, {
        score: delivery.nextAttemptAt,
        member: delivery.eventId,
      });
    }
    return;
  }
  const store = await readFileStore();
  store.deliveries[delivery.eventId] = delivery;
  if (delivery.status === "sent") {
    store.queue = store.queue.filter((id) => id !== delivery.eventId);
  } else if (!store.queue.includes(delivery.eventId)) {
    store.queue.push(delivery.eventId);
  }
  await writeFileStore(store);
}

/** Acquire short-lived processing lock (NX + TTL). */
export async function acquireProcessingLock(
  eventId: string,
  ttlSeconds = 90,
): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const ok = await redis.set(lockKey(eventId), "1", {
      nx: true,
      ex: ttlSeconds,
    });
    return ok != null;
  }
  // File fallback: soft lock via status flip
  const store = await readFileStore();
  const d = store.deliveries[eventId];
  if (!d) return false;
  if (d.status === "processing" && d.nextAttemptAt > Date.now()) return false;
  d.status = "processing";
  d.updatedAt = new Date().toISOString();
  store.deliveries[eventId] = d;
  await writeFileStore(store);
  return true;
}

export async function releaseProcessingLock(eventId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(lockKey(eventId));
    return;
  }
}

/** Due pending/failed deliveries for the retry worker. */
export async function listDueDeliveries(
  limit = 20,
): Promise<MetaCapiPurchaseDelivery[]> {
  const now = Date.now();
  const redis = getRedis();
  if (redis) {
    const ids = await redis.zrange(QUEUE_KEY, 0, now, {
      byScore: true,
      offset: 0,
      count: limit,
    });
    const out: MetaCapiPurchaseDelivery[] = [];
    for (const id of ids as string[]) {
      const d = await getDelivery(id);
      if (d && d.status !== "sent") out.push(d);
    }
    return out;
  }
  const store = await readFileStore();
  return Object.values(store.deliveries)
    .filter(
      (d) =>
        d.status !== "sent" &&
        d.nextAttemptAt <= now &&
        d.status !== "processing",
    )
    .slice(0, limit);
}
