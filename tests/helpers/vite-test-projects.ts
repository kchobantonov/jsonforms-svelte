import type { TestUserConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

export function workspaceTests(
  suite: 'library' | 'demo' | 'demo-common' | 'webcomponent' = 'library',
): TestUserConfig {
  const roots = suite === 'library' ? ['src', 'tests'] : ['tests'];
  const browserTests =
    suite === 'webcomponent'
      ? ['tests/**/*.browser.spec.ts']
      : roots.map((root) => `${root}/**/*.svelte.{test,spec}.{js,ts}`);
  const serverTests =
    suite === 'webcomponent'
      ? ['tests/**/*.spec.ts']
      : roots.map((root) => `${root}/**/*.{test,spec}.{js,ts}`);

  return {
    // Preserve separate SvelteKit browser and server plugin lifecycles.
    sharedViteServer: false,
    expect: { requireAssertions: true },
    projects: [
      {
        extends: true,
        test: {
          name: 'client',
          ...(suite === 'demo' ? {} : { fileParallelism: false }),
          browser: {
            // Keep existing partial locator matches explicit under Vitest 5.
            locators: { exact: false },
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium', headless: true }],
          },
          include: browserTests,
          ...(suite === 'webcomponent'
            ? {}
            : {
                exclude: [suite === 'library' ? 'src/lib/server/**' : 'tests/src/lib/server/**'],
              }),
        },
      },
      {
        extends: true,
        test: { name: 'server', environment: 'node', include: serverTests, exclude: browserTests },
      },
    ],
  };
}

export const rendererTestDependencies = [
  'ajv',
  'lodash/isEmpty',
  'lodash/isObject',
  'lodash/isEqual',
  'lodash/memoize',
  'lodash/template',
  'lodash/startCase',
  'lodash/omit',
  'lodash/set',
  'tailwind-variants',
];

export const extendedMonacoWorker =
  '@chobantonov/jsonforms-svelte-extended > monaco-editor/esm/vs/language/css/workerManager.js';

export function testDependencies(include: string[]) {
  return process.env.VITEST === 'true' ? { optimizeDeps: { include } } : {};
}
