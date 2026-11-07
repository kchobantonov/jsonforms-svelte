import { configDefaults, defineConfig } from 'vite-plus';
export default defineConfig({
  test: {
    name: 'integration',
    // Keep long production matrices observable under agent and CI environments.
    reporters: ['verbose'],
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: [...configDefaults.exclude, 'test-results/**', 'coverage/**'],
    fileParallelism: true,
    maxWorkers: 2,
    retry: 1,
    testTimeout: 120_000,
    hookTimeout: 60_000,
    // Browser demos can take longer than Vitest's 1s default to hydrate on CI.
    expect: { poll: { timeout: 10_000 } },
  },
});
