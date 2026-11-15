import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceIndex = process.argv.indexOf('--source');
const source =
  sourceIndex < 0
    ? path.resolve(root, '../jsonforms-extended-spec')
    : path.resolve(process.argv[sourceIndex + 1]);
const local = path.join(root, 'packages/jsonforms-svelte-demo-common/src/lib/examples');
const catalog = JSON.parse(readFileSync(path.join(source, 'examples/catalog.json'), 'utf8'));
const ids = new Set(catalog.map(({ id }) => id));
assert.equal(ids.size, catalog.length, 'Spec catalog IDs must be unique');
const adapters = readdirSync(local, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('spec-'))
  .map((entry) => entry.name.slice(5));
for (const id of adapters) assert.ok(ids.has(id), `Unknown Svelte adapter: ${id}`);
for (const entry of catalog) {
  for (const file of entry.files) {
    const shared = path.join(source, 'examples', entry.id, file);
    assert.ok(existsSync(shared), `Missing shared fixture: ${entry.id}/${file}`);
    const duplicate = path.join(local, `spec-${entry.id}`, file);
    assert.ok(!existsSync(duplicate), `Copied fixture remains in demo-common: ${entry.id}/${file}`);
  }
}
console.log(
  `Using ${catalog.length} shared spec examples; no canonical fixtures copied into demo-common.`,
);
