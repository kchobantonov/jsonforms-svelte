import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examples = path.join(root, 'packages/jsonforms-svelte-demo-common/src/lib/examples');
const manifestPath = path.join(examples, 'spec-provenance.json');
const catalogPath = path.join(examples, 'spec-catalog.json');
const sourceIndex = process.argv.indexOf('--source');
const source = sourceIndex < 0 ? undefined : path.resolve(process.argv[sourceIndex + 1]);
const write = process.argv.includes('--write');
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
};
const digest = (file) =>
  createHash('sha256')
    .update(JSON.stringify(canonical(JSON.parse(readFileSync(file, 'utf8')))))
    .digest('hex');
const directories = readdirSync(examples, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('spec-'))
  .map((entry) => entry.name)
  .sort();
if (write) {
  assert.ok(source, '--write requires an explicit --source spec checkout');
  execFileSync('git', ['-C', source, 'diff', '--exit-code', 'HEAD', '--', 'examples'], {
    stdio: 'pipe',
  });
  const revision = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim();
  const catalog = JSON.parse(readFileSync(path.join(source, 'examples/catalog.json'), 'utf8'));
  const imported = directories.map((directory) => {
    const id = directory.slice(5);
    const entry = catalog.find((item) => item.id === id);
    assert.ok(entry, `Missing source catalog entry: ${id}`);
    const files = Object.fromEntries(
      entry.files
        .filter((name) => name.endsWith('.json'))
        .map((name) => {
          const hash = digest(path.join(source, 'examples', id, name));
          assert.equal(
            digest(path.join(examples, directory, name)),
            hash,
            `${directory}/${name} differs from the source`,
          );
          return [name, hash];
        }),
    );
    return {
      id,
      source: `https://github.com/kchobantonov/jsonforms-extended-spec/tree/${revision}/examples/${id}`,
      files,
    };
  });
  writeFileSync(catalogPath, readFileSync(path.join(source, 'examples/catalog.json'), 'utf8'));
  writeFileSync(
    manifestPath,
    JSON.stringify({ revision, catalogHash: digest(catalogPath), imported }, null, 2) + '\n',
  );
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
assert.equal(
  digest(catalogPath),
  manifest.catalogHash,
  'Generated catalog changed without a provenance update',
);
assert.deepEqual(
  catalog.map((entry) => `spec-${entry.id}`).sort(),
  directories,
  'Every source catalog entry must be imported, with no unlisted fixtures',
);
if (source)
  assert.equal(
    digest(path.join(source, 'examples/catalog.json')),
    manifest.catalogHash,
    'The upstream catalog changed; review new or changed fixtures before updating provenance',
  );

assert.deepEqual(
  manifest.imported.map((entry) => `spec-${entry.id}`).sort(),
  directories,
  'Every imported fixture needs provenance',
);
for (const entry of manifest.imported) {
  for (const [name, expected] of Object.entries(entry.files)) {
    assert.equal(
      digest(path.join(examples, `spec-${entry.id}`, name)),
      expected,
      `${entry.id}/${name}: source JSON changed`,
    );
    if (source)
      assert.equal(
        digest(path.join(source, 'examples', entry.id, name)),
        expected,
        `${entry.id}/${name}: upstream fixture changed; review before updating provenance`,
      );
  }
}
// Source catalog translations and host supplements must retain matching message
// keys and supported interpolation parameters across the required locales.
const messages = (value, prefix = '') =>
  Object.entries(value).flatMap(([key, text]) => {
    const id = prefix ? `${prefix}.${key}` : key;
    return typeof text === 'string'
      ? [[id, text]]
      : text && typeof text === 'object'
        ? messages(text, id)
        : [];
  });
const parameters = (text) =>
  [...new Set([...text.matchAll(/\$\{([A-Za-z_$][\w$]*)\}/g)].map((match) => match[1]))].sort();
for (const directory of directories) {
  const catalogs = { en: {}, bg: {} };
  for (const name of ['translations.json', 'translations.supplement.json']) {
    const file = path.join(examples, directory, name);
    if (!existsSync(file)) continue;
    const translations = JSON.parse(readFileSync(file, 'utf8'));
    for (const locale of ['en', 'bg']) Object.assign(catalogs[locale], translations[locale]);
  }
  const en = Object.fromEntries(messages(catalogs.en));
  const bg = Object.fromEntries(messages(catalogs.bg));
  assert.ok(Object.keys(en).length, `${directory}: missing English messages`);
  assert.deepEqual(
    Object.keys(en).sort(),
    Object.keys(bg).sort(),
    `${directory}: EN/BG message keys differ`,
  );
  for (const key of Object.keys(en))
    assert.deepEqual(
      parameters(en[key]),
      parameters(bg[key]),
      `${directory}/${key}: EN/BG parameters differ`,
    );
}
console.log(
  `Spec provenance matches ${manifest.imported.length} imported fixtures${source ? ' and the source checkout' : ''}.`,
);
