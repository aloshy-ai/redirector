import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig: Config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest-setup.ts'], // Changed from jest.setup.ts to jest-setup.ts

  // Indicate where your test files are located
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],

  // Handle TypeScript and module resolution
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json'],

  // Environment variables
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  // Timeout settings
  testTimeout: 10000,

  // Clear mocks before each test
  clearMocks: true,

  // Don't show verbose console output
  verbose: false,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(customJestConfig)
