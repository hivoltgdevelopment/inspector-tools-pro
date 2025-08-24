import { enqueueUpload, getQueuedItems, flushQueue } from '@/lib/uploadQueue';
import { vi, describe, it, expect } from 'vitest';

describe('uploadQueue', () => {
  it('stores files and flushes them when uploader succeeds', async () => {
    const uploader = vi.fn().mockResolvedValue(undefined);
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
    await enqueueUpload(file);
    expect((await getQueuedItems()).length).toBe(1);
    await flushQueue(uploader);
    expect(uploader).toHaveBeenCalledWith(file);
    expect((await getQueuedItems()).length).toBe(0);
  });
});
