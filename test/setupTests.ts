import '@testing-library/jest-dom';
import { vi } from 'vitest';
// Silence the toast UI by mocking the sonner module below

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

// Silence toast UI completely in tests
vi.mock('sonner', () => {
  const noop = () => {};
  const toast = Object.assign(noop, {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    message: vi.fn(),
  });
  return { Toaster: () => null, toast };
});

import * as idbKeyval from 'idb-keyval';

// Preserve originals for restoration after tests
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
const originalAlert = window.alert;
const originalSpeechRecognition = (window as any).SpeechRecognition;
const originalWebkitSpeechRecognition = (window as any).webkitSpeechRecognition;

beforeEach(() => {
  (idbKeyval as any)._store.clear();
});

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

  // Provide a no-op alert to avoid jsdom "not implemented" errors
  if (!vi.isMockFunction(window.alert)) {
    Object.defineProperty(window, 'alert', {
      value: vi.fn(),
      configurable: true,
      writable: true,
    });
  }

  // Provide a minimal SpeechRecognition mock if missing; tests can override
  const makeSR = () => {
    return class MockRecognition {
      continuous = true;
      interimResults = true;
      lang = 'en-US';
      onresult: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn(() => this.onend && this.onend());
    } as unknown as new () => SpeechRecognition;
  };
  if (!(window as any).SpeechRecognition) {
    Object.defineProperty(window as any, 'SpeechRecognition', {
      value: makeSR(),
      configurable: true,
      writable: true,
    });
  }
  if (!(window as any).webkitSpeechRecognition) {
    Object.defineProperty(window as any, 'webkitSpeechRecognition', {
      value: (window as any).SpeechRecognition || makeSR(),
      configurable: true,
      writable: true,
    });
  }

  // Provide minimal crypto.randomUUID for environments lacking it
  const g: any = globalThis as any;
  if (!g.crypto || typeof g.crypto.randomUUID !== 'function') {
    const randomUUID = () =>
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    const getRandomValues = (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) arr[i] = (Math.random() * 256) | 0;
      return arr;
    };
    Object.defineProperty(g, 'crypto', {
      value: { randomUUID, getRandomValues },
      configurable: true,
      writable: true,
    });
  }

  // Toaster rendering is disabled by the mock above
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

  Object.defineProperty(window, 'alert', {
    // @ts-expect-error allow undefined restoration
    value: originalAlert,
    configurable: true,
  });

  Object.defineProperty(window as any, 'SpeechRecognition', {
    // @ts-expect-error allow undefined restoration
    value: originalSpeechRecognition,
    configurable: true,
  });
  Object.defineProperty(window as any, 'webkitSpeechRecognition', {
    // @ts-expect-error allow undefined restoration
    value: originalWebkitSpeechRecognition,
    configurable: true,
  });

  // No toaster to unmount because we mock sonner
});
