import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const config = readJson(join(root, '.changeset/config.json'));
const packageNames = readdirSync(join(root, 'packages'))
  .map((directory) => readJson(join(root, 'packages', directory, 'package.json')))
  .filter((manifest) => !manifest.private)
  .map((manifest) => manifest.name)
  .sort();

assert.equal(config.fixed.length, 1, 'All public packages must be in one fixed group');
assert.deepEqual(
  [...config.fixed[0]].sort(),
  packageNames,
  'The fixed group must contain every public package, and no private package',
);

console.log(`Release group contains all ${packageNames.length} public packages.`);
