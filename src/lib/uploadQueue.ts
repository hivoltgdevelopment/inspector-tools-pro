import { createStore, get, set, del, keys } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';

const store = createStore('upload-queue', 'files');

export interface QueueItem {
  id: string;
  file: File;
  timestamp: number;
}

export async function enqueueUpload(file: File) {
  const item: QueueItem = {
    id: uuidv4(),
    file,
    timestamp: Date.now(),
  };
  await set(item.id, item, store);
  return item;
}

export async function getQueuedItems() {
  const ids = await keys(store);
  const items: QueueItem[] = [];
  for (const id of ids) {
    const item = await get<QueueItem>(id, store);
    if (item) items.push(item);
  }
  return items;
}

export async function flushQueue(
  uploader: (file: File) => Promise<void>
) {
  const items = await getQueuedItems();
  for (const item of items) {
    try {
      await uploader(item.file);
      await del(item.id, store);
    } catch (err) {
      console.error('Upload failed, will retry later', err);
    }
  }
}

export function startUploadWorker(
  uploader: (file: File) => Promise<void>,
  onFlush?: (count: number) => void
) {
  const run = async () => {
    await flushQueue(uploader);
    if (onFlush) {
      const items = await getQueuedItems();
      onFlush(items.length);
    }
  };
  window.addEventListener('online', run);
  // Attempt flush on startup
  void run();
  return () => window.removeEventListener('online', run);
}
