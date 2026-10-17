import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';

const root = fileURLToPath(new URL('..', import.meta.url));
const inventoryPath = path.join(root, 'docs/renderer-source-inventory.md');
let inventory = await readFile(inventoryPath, 'utf8');
const original = inventory;
const failures = [];

async function files(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  const nested = await Promise.all(
    entries.map((entry) => {
      const name = path.join(directory, entry.name);
      return entry.isDirectory() ? files(name) : [name];
    }),
  );
  return nested.flat();
}

const packages = (await readdir(path.join(root, 'packages'), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory() && entry.name.startsWith('jsonforms-svelte'))
  .map((entry) => entry.name)
  .sort();
const actualEntries = new Set();
for (const name of packages) {
  const source = await files(path.join(root, 'packages', name, 'src'));
  const tests = await files(path.join(root, 'packages', name, 'tests'));
  for (const file of source.filter((file) => file.endsWith('.entry.ts'))) {
    const relative = path.relative(root, file).split(path.sep).join('/');
    actualEntries.add(relative);
    if (!inventory.includes(`../${relative})`))
      failures.push(`Missing renderer entry link: ${relative}`);
  }
  const specs = [...source, ...tests].filter((file) => /\.(spec|test)\.[jt]sx?$/.test(file));
  const browser = specs.filter((file) => /\.svelte\.(spec|test)\.[jt]sx?$/.test(file));
  const row = new RegExp('\\| `' + name + '`\\s*\\|\\s*(\\d+)\\s*\\|\\s*(\\d+)\\s*\\|');
  const match = inventory.match(row);
  if (!match) failures.push(`Missing test inventory row: ${name}`);
  else if (Number(match[1]) !== specs.length || Number(match[2]) !== browser.length) {
    if (process.argv.includes('--write')) {
      inventory = inventory.replace(row, `| \`${name}\` | ${specs.length} | ${browser.length} |`);
    } else
      failures.push(
        `Stale test counts for ${name}: expected ${specs.length} total / ${browser.length} browser component files`,
      );
  }
}
for (const match of inventory.matchAll(/\]\(\.\.\/(packages\/[^)]+\.entry\.ts)\)/g)) {
  if (!actualEntries.has(match[1])) failures.push(`Stale renderer entry link: ${match[1]}`);
}
if (inventory !== original) {
  const options = await resolveConfig(inventoryPath);
  await writeFile(inventoryPath, await format(inventory, { ...options, filepath: inventoryPath }));
}
if (failures.length) {
  console.error(failures.join('\n'));
  console.error('Update the source inventory; --write refreshes test-file counts only.');
  process.exitCode = 1;
} else
  console.log(
    `Renderer inventory matches ${actualEntries.size} entry files and ${packages.length} package test inventories.`,
  );
