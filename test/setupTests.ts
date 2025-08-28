import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';

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

// Preserve any existing implementations so we can restore them after tests
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;
const originalAlert = window.alert;
const originalSpeechRecognition = (window as any).SpeechRecognition;
const originalWebkitSpeechRecognition = (window as any).webkitSpeechRecognition;
let toasterRoot: ReturnType<typeof createRoot> | null = null;

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
      onresult: ((event: any) => void) | null = null;
      onend: (() => void) | null = null;
      start = vi.fn();
      stop = vi.fn(() => this.onend && this.onend());
    } as unknown as typeof (window as any).SpeechRecognition;
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
  if (toasterRoot) {
    toasterRoot.unmount();
    toasterRoot = null;
  }
});

// Mount a global Toaster so toast() calls render during tests
beforeAll(() => {
  const host = document.createElement('div');
  document.body.appendChild(host);
  toasterRoot = createRoot(host);
  toasterRoot.render(
    React.createElement(React.StrictMode, null, React.createElement(Toaster, { position: 'top-right' }))
  );
});
