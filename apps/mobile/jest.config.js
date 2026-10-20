/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@dahamiz/design-tokens$': '<rootDir>/../../packages/design-tokens/src/index.ts',
    '^@dahamiz/shared-types$': '<rootDir>/../../packages/shared-types/src/index.ts',
  },
  collectCoverageFrom: ['app/**/*.{ts,tsx}', 'src/**/*.{ts,tsx}', '!**/*.d.ts'],
};
