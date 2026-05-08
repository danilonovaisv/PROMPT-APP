const workspaceIgnorePatterns = [
  '<rootDir>/.agent/',
  '<rootDir>/.agents/',
  '<rootDir>/backup-superpower/',
];

module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  // E2E tests use @playwright/test runner — must run via `pnpm test:e2e`, not Jest
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    ...workspaceIgnorePatterns
  ],
  modulePathIgnorePatterns: workspaceIgnorePatterns,
  watchPathIgnorePatterns: workspaceIgnorePatterns,
  moduleNameMapper: {
    '^@/lib/supabase$': '<rootDir>/tests/mocks/supabase.ts',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/lib/**',
    '!src/vite-env.d.ts',
    '!src/instrument.ts',
    '!src/utils/logger.ts',
    '!src/utils/supabase.ts',
    '!src/lib/supabase.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 15,
      lines: 15,
      statements: 15,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
};
