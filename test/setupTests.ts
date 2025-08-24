import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Preserve any existing implementations so we can restore them after tests
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

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
