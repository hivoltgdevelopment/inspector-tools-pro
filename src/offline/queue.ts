import { createStore, get, set, del, keys } from 'idb-keyval';

export interface UploadItem {
  id: string;
  file: File;
  meta?: Record<string, unknown>;
  // retry metadata (not required by callers)
  retries?: number;
  nextAttemptAt?: number; // epoch ms
}

const store = createStore('inspection-upload-queue', 'items');

const now = () => Date.now();

function computeBackoff(retries: number): number {
  // Exponential backoff with jitter: base 1s, cap ~60s
  const base = 1000; // 1s
  const max = 60_000; // 60s
  const exp = Math.min(max, base * Math.pow(2, Math.max(0, retries)));
  const jitter = Math.floor(Math.random() * 250); // up to 250ms jitter
  return exp + jitter;
}

export async function enqueueUpload(item: UploadItem) {
  const record: UploadItem = {
    ...item,
    id: item.id || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${now()}`),
    retries: item.retries ?? 0,
    nextAttemptAt: item.nextAttemptAt ?? now(),
  };
  await set(record.id, record, store);
}

async function getQueuedItems(): Promise<UploadItem[]> {
  const ids = await keys(store);
  const items: UploadItem[] = [];
  for (const id of ids) {
    const it = await get<UploadItem>(id, store);
    if (it) items.push(it);
  }
  // Order by nextAttemptAt then timestamp (implicit by id/time)
  items.sort((a, b) => (a.nextAttemptAt ?? 0) - (b.nextAttemptAt ?? 0));
  return items;
}

export async function flushQueue(handler: (item: UploadItem) => Promise<void>) {
  const items = await getQueuedItems();
  for (const item of items) {
    // Skip if scheduled for the future
    if ((item.nextAttemptAt ?? 0) > now()) continue;
    try {
      await handler(item);
      await del(item.id, store);
    } catch (err) {
      // schedule retry
      const retries = (item.retries ?? 0) + 1;
      const delay = computeBackoff(retries);
      const updated: UploadItem = {
        ...item,
        retries,
        nextAttemptAt: now() + delay,
      };
      await set(item.id, updated, store);
      // continue with remaining items
    }
  }
}

export function startUploadWorker(
  handler: (item: UploadItem) => Promise<void>
) {
  const run = async () => {
    await flushQueue(handler);
  };
  window.addEventListener('online', run);
  // attempt flush on startup
  void run();
  return () => window.removeEventListener('online', run);
}
