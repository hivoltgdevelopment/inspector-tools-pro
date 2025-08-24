import '@testing-library/jest-dom';
import { vi } from 'vitest';

vi.mock('idb-keyval', () => {
  const store = new Map<string, any>();
  return {
    createStore: () => ({}),
    set: (key: any, val: any) => {
      store.set(key, val);
      return Promise.resolve();
    },
    get: (key: any) => Promise.resolve(store.get(key)),
    del: (key: any) => {
      store.delete(key);
      return Promise.resolve();
    },
    keys: () => Promise.resolve(Array.from(store.keys())),
    _store: store,
  };
});

import * as idbKeyval from 'idb-keyval';

codex/continue-implementation-of-feature-xdvitk
main
// Preserve any existing implementations so we can restore them after tests
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

codex/continue-implementation-of-feature-xdvitk
main
main
beforeEach(() => {
  (idbKeyval as any)._store.clear();
});

codex/continue-implementation-of-feature-xdvitk
main
beforeAll(() => {
  // jsdom doesn't implement these APIs, so provide lightweight mocks
  Object.defineProperty(global.URL, 'createObjectURL', {
    value: vi.fn(() => 'blob:mock-url'),
    configurable: true,
    writable: true,
  });
  Object.defineProperty(global.URL, 'revokeObjectURL', {
    value: vi.fn(),
    configurable: true,
    writable: true,
  });
});

afterAll(() => {
  // restore originals to avoid cross-test pollution
  Object.defineProperty(global.URL, 'createObjectURL', {
    // @ts-expect-error allow undefined restoration
    value: originalCreateObjectURL,
    configurable: true,
  });
  Object.defineProperty(global.URL, 'revokeObjectURL', {
    // @ts-expect-error allow undefined restoration
    value: originalRevokeObjectURL,
    configurable: true,
  });
});
