import { createStore, get, set, del, keys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

const store = createStore('form-queue', 'forms');

export interface FormQueueItem {
  id: string;
  data: any;
  timestamp: number;
}

export async function enqueueForm(data: any) {
  const item: FormQueueItem = {
    id: uuidv4(),
    data,
    timestamp: Date.now(),
  };
  await set(item.id, item, store);
  return item;
}

export async function getQueuedForms() {
  const ids = await keys(store);
  const items: FormQueueItem[] = [];
  for (const id of ids) {
    const item = await get<FormQueueItem>(id, store);
    if (item) items.push(item);
  }
  return items;
}

export async function flushQueue(
  uploader: (data: any) => Promise<void>
) {
  const items = await getQueuedForms();
  for (const item of items) {
    try {
      await uploader(item.data);
      await del(item.id, store);
    } catch (err) {
      console.error('Form submission failed, will retry later', err);
    }
  }
}

export function startFormWorker(
  uploader: (data: any) => Promise<void>,
  onFlush?: (count: number) => void
) {
  const run = async () => {
    await flushQueue(uploader);
    if (onFlush) {
      const items = await getQueuedForms();
      onFlush(items.length);
    }
  };
  window.addEventListener('online', run);
  void run();
  return () => window.removeEventListener('online', run);
}
