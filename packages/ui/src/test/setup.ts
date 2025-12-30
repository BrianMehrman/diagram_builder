/**
 * Vitest test setup
 * Configures global test environment for React component testing
 */

import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Custom matchers can be added here if needed
// Example: import matchers from '@testing-library/jest-dom/matchers';
// expect.extend(matchers);
