import type { TestUserConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

function browserExclusions(suite: string) {
  if (suite === 'webcomponent') return {};
  return { exclude: [suite === 'library' ? 'src/lib/server/**' : 'tests/src/lib/server/**'] };
}

function serverTestFiles(suite: string, roots: string[]) {
  if (suite === 'webcomponent') return ['tests/**/*.spec.ts'];
  return roots.map((root) => `${root}/**/*.{test,spec}.{js,ts}`);
}

export function workspaceTests(
  suite: 'library' | 'demo' | 'demo-common' | 'webcomponent' = 'library',
): TestUserConfig {
  const roots = suite === 'library' ? ['src', 'tests'] : ['tests'];
  const browserTests =
    suite === 'webcomponent'
      ? ['tests/**/*.browser.spec.ts']
      : roots.map((root) => `${root}/**/*.svelte.{test,spec}.{js,ts}`);
  const serverTests = serverTestFiles(suite, roots);

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
          ...browserExclusions(suite),
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
