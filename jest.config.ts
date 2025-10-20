import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['./tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],

  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: false,
        tsconfig: {
          module: 'CommonJS',
          moduleResolution: 'Node',
          isolatedModules: true,
          esModuleInterop: true,
        },
      },
    ],
  },

  // import 매핑
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },

  setupFilesAfterEnv: ['./tests/setup/jest.setup.js'],

  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 30_000,
};

export default config;
