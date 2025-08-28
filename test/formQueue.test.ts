import { enqueueForm, getQueuedForms, flushQueue } from '@/lib/formQueue';
import { vi, describe, it, expect } from 'vitest';

describe('formQueue', () => {
  it('stores form data and flushes it when uploader succeeds', async () => {
    const uploader = vi.fn().mockResolvedValue(undefined);
    const data = { propertyType: 'single', responses: { foo: 'bar' } };
    await enqueueForm(data);
    expect((await getQueuedForms()).length).toBe(1);
    await flushQueue(uploader);
    expect(uploader).toHaveBeenCalledWith(data);
    expect((await getQueuedForms()).length).toBe(0);
  });
});
