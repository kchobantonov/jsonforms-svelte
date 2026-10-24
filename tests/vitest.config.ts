import { configDefaults, defineConfig } from 'vite-plus';
export default defineConfig({
  test: {
    name: 'integration',
    // Keep long production matrices observable under agent and CI environments.
    reporters: ['verbose'],
    environment: 'node',
    include: ['**/*.spec.ts'],
    exclude: [...configDefaults.exclude, 'test-results/**', 'coverage/**'],
    fileParallelism: false,
    testTimeout: 120_000,
    hookTimeout: 60_000,
  },
});
