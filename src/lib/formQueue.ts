import { createStore, get, set, del, keys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

const store = createStore('form-queue', 'forms');

export interface FormQueueItem<T = unknown> {
  id: string;
  data: T;
  timestamp: number;
}

export async function enqueueForm<T>(data: T) {
  const item: FormQueueItem<T> = {
    id: uuidv4(),
    data,
    timestamp: Date.now(),
  };
  await set(item.id, item, store);
  return item;
}

export async function getQueuedForms<T = unknown>() {
  const ids = await keys(store);
  const items: FormQueueItem<T>[] = [];
  for (const id of ids) {
    const item = await get<FormQueueItem<T>>(id, store);
    if (item) items.push(item);
  }
  return items;
}

export async function flushQueue<T>(
  uploader: (data: T) => Promise<void>
) {
  const items = await getQueuedForms<T>();
  for (const item of items) {
    try {
      await uploader(item.data);
      await del(item.id, store);
    } catch (err) {
      console.error('Form submission failed, will retry later', err);
    }
  }
}

export function startFormWorker<T>(
  uploader: (data: T) => Promise<void>,
  onFlush?: (count: number) => void
) {
  const run = async () => {
    await flushQueue<T>(uploader);
    if (onFlush) {
      const items = await getQueuedForms<T>();
      onFlush(items.length);
    }
  };
  window.addEventListener('online', run);
  void run();
  return () => window.removeEventListener('online', run);
}
