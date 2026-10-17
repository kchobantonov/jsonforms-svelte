import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    name: 'integration',
    environment: 'node',
    include: ['**/*.spec.ts'],
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 60_000,
  },
});
