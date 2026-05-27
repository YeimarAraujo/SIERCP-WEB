/**
 * Global test setup — runs before every test file.
 * Polyfills crypto.subtle (used by SHA-256 in API routes) and
 * resets all vi.mock state between tests.
 */
import { vi, afterEach } from 'vitest';

// Reset mocks between tests so state doesn't leak
afterEach(() => {
  vi.clearAllMocks();
});
