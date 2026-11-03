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
  expect(references).toBeGreaterThan(1_500);
  expect(missing).toEqual([]);
});

it('keeps every canonical example linked to a production evidence source', () => {
  const catalog = JSON.parse(
    readFileSync(
      resolve(root, 'packages/jsonforms-svelte-demo-common/src/lib/examples/spec-catalog.json'),
      'utf8',
    ),
  ) as Array<{ id: string }>;
  const map = readFileSync(resolve(root, 'docs/spec-example-evidence-map.md'), 'utf8');
  const matrix = readFileSync(resolve(root, 'docs/spec-example-matrix.md'), 'utf8');
  const rows = [...map.matchAll(/^\|\s*`spec-([^`]+)`\s*\|\s*(.+?)\s*\|$/gm)];
  const ids = rows.map((row) => row[1]);
  expect(ids).toHaveLength(47);
  expect(ids).toEqual(catalog.map(({ id }) => id));
  for (const [, id, sources] of rows) {
    expect(matrix).toContain(`\`spec-${id}\``);
    const paths = [...sources.matchAll(/\]\(\.\.\/(tests\/demos\/[^)]+\.spec\.ts)\)/g)].map(
      (match) => match[1],
    );
    expect(paths.length).toBeGreaterThan(0);
    for (const path of paths) {
      const source = readFileSync(resolve(root, path), 'utf8');
      expect(source.includes(`spec-${id}`) || source.includes(`route('${id}')`)).toBe(true);
    }
  }
});
