// Vitest: extend matchers
import '@testing-library/jest-dom/vitest';

// Mock missing browser APIs
const originalURL = global.URL;

beforeAll(() => {
  // @ts-expect-error adding missing method in test env
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  // @ts-expect-error optional but nice to have
  global.URL.revokeObjectURL = vi.fn();
});

afterAll(() => {
  // restore (safer if other suites touch URL)
  global.URL = originalURL;
});
