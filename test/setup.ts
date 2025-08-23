import '@testing-library/jest-dom';
import { vi } from 'vitest';

const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

beforeAll(() => {
  // @ts-expect-error jsdom does not implement createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  // @ts-expect-error jsdom does not implement revokeObjectURL
  global.URL.revokeObjectURL = vi.fn();
});

afterAll(() => {
  // @ts-expect-error restore original implementations
  global.URL.createObjectURL = originalCreateObjectURL;
  // @ts-expect-error restore original implementations
  global.URL.revokeObjectURL = originalRevokeObjectURL;
});
