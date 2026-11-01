import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vite-plus/test';

const root = fileURLToPath(new URL('../', import.meta.url));
const fixtureDir = resolve(root, 'tests/fixtures/spec-conformance');

function expandBraces(path: string): string[] {
  const match = /\{([^{}]*)\}/.exec(path);
  if (!match) return [path];
  return match[1]
    .split(',')
    .flatMap((choice) =>
      expandBraces(path.slice(0, match.index) + choice + path.slice(match.index + match[0].length)),
    );
}

it('keeps every config and local-option review test reference resolvable', () => {
  const fixtures = readdirSync(fixtureDir).filter(
    (file) =>
      /^svelte-(config|local-option)-review.*\.json$/.test(file) ||
      file === 'svelte-config-additions.json',
  );
  const missing: string[] = [];
  let references = 0;
  for (const fixture of fixtures) {
    const rows = JSON.parse(readFileSync(resolve(fixtureDir, fixture), 'utf8')) as Array<{
      path: string;
      tests: string[];
    }>;
    for (const row of rows) {
      for (const pattern of row.tests) {
        for (const testPath of expandBraces(pattern)) {
          references++;
          if (!existsSync(resolve(root, testPath)))
            missing.push(`${fixture}: ${row.path} -> ${testPath}`);
        }
      }
    }
  }
  expect(references).toBeGreaterThan(1_600);
  expect(missing).toEqual([]);
});
