import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],

  testMatch: ['**/*.test.ts'],

  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: false, tsconfig: 'tsconfig.json' }],
  },

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^#core/(.*)$': '<rootDir>/src/core/$1',
    '^#modules/(.*)$': '<rootDir>/src/modules/$1',
    '^#common/(.*)$': '<rootDir>/src/common/$1',
    '^#errors/(.*)$': '<rootDir>/src/common/errors/$1',
    '^#utils/(.*)$': '<rootDir>/src/core/utils/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.logger-mock.ts', '<rootDir>/tests/setup/jest.setup.js'],

  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{ts,js}'],
  coverageDirectory: '<rootDir>/coverage',

  testTimeout: 30_000,
};

export default config;
