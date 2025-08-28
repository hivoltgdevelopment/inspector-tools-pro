export interface UploadItem {
  id: string;
  file: File;
  meta?: any;
}

const uploads: UploadItem[] = [];

export async function enqueueUpload(item: UploadItem) {
  uploads.push(item);
}

export async function flushQueue(handler: (item: UploadItem) => Promise<void>) {
  while (uploads.length) {
    const item = uploads.shift()!;
    await handler(item);
  }
}
