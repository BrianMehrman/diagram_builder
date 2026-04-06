import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

/** Globals available in all browser environments */
const browserGlobals = {
  // DOM
  document: 'readonly',
  window: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  history: 'readonly',
  screen: 'readonly',
  alert: 'readonly',
  confirm: 'readonly',
  prompt: 'readonly',
  // DOM element types
  HTMLElement: 'readonly',
  HTMLInputElement: 'readonly',
  HTMLButtonElement: 'readonly',
  HTMLDivElement: 'readonly',
  HTMLCanvasElement: 'readonly',
  HTMLFormElement: 'readonly',
  HTMLSelectElement: 'readonly',
  HTMLTextAreaElement: 'readonly',
  // Events
  Event: 'readonly',
  CustomEvent: 'readonly',
  KeyboardEvent: 'readonly',
  MouseEvent: 'readonly',
  PointerEvent: 'readonly',
  InputEvent: 'readonly',
  FocusEvent: 'readonly',
  EventTarget: 'readonly',
  FrameRequestCallback: 'readonly',
  // Timers / animation
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  // Performance
  performance: 'readonly',
  // Storage
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  Storage: 'readonly',
  // Fetch / network
  fetch: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  Headers: 'readonly',
  // Encoding
  btoa: 'readonly',
  atob: 'readonly',
  // URL
  URL: 'readonly',
  URLSearchParams: 'readonly',
  FormData: 'readonly',
  Blob: 'readonly',
  File: 'readonly',
  FileReader: 'readonly',
  // Workers / observers
  MutationObserver: 'readonly',
  ResizeObserver: 'readonly',
  IntersectionObserver: 'readonly',
  // Fetch API types
  RequestInit: 'readonly',
  RequestInfo: 'readonly',
  Response: 'readonly',
  Request: 'readonly',
  BlobPart: 'readonly',
  // React (for explicit React.* usage in React apps)
  React: 'readonly',
}

/** Globals available only in Node.js environments */
const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  setTimeout: 'readonly',
  setInterval: 'readonly',
  setImmediate: 'readonly',
  clearTimeout: 'readonly',
  clearInterval: 'readonly',
  clearImmediate: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  NodeJS: 'readonly',
  module: 'readonly',
  require: 'readonly',
  exports: 'readonly',
  global: 'readonly',
}

/** Vitest globals injected by the test runner */
const vitestGlobals = {
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  vi: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  suite: 'readonly',
  structuredClone: 'readonly',
}

export default [
  {
    ignores: ['packages/core/src/ivm/builder.d.ts', 'packages/core/src/ivm/types.d.ts'],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/__test-fixtures__/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
      },
      globals: {
        ...nodeGlobals,
        ...browserGlobals,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs['recommended-requiring-type-checking'].rules,

      // Strict TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'error',

      // Best practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...nodeGlobals,
        ...browserGlobals,
        ...vitestGlobals,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.git/**', '_bmad/**', '_bmad-output/**'],
  },
]
