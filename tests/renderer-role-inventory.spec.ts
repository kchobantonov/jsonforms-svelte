import { readdir, readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { expect, it } from 'vite-plus/test';
import inventory from './fixtures/renderer-roles.json';

const root = fileURLToPath(new URL('..', import.meta.url));
const roles = Object.entries(inventory.roles);
const sources = roles.flatMap(([, role]) =>
  role.sources.flatMap((source) =>
    source.includes('{family}')
      ? ['flowbite', 'shadcn', 'skeleton'].map((family) => source.replace('{family}', family))
      : [source],
  ),
);

it('maps exactly the renderer roles recorded in the spec parity audit', async () => {
  const audit = await readFile(path.join(root, 'docs/renderer-parity-audit.md'), 'utf8');
  const ids = [...audit.matchAll(/^\|\s*(R\d+)\s*\|/gm)].map((match) => match[1]);
  expect([...new Set(ids)].sort()).toEqual(roles.map(([id]) => id).sort());
  expect(ids.length).toBe(new Set(ids).size);
});

it.each([...new Set(sources)])(
  'retains the role implementation or explicit compatibility record %s',
  async (source) => {
    await expect(access(path.join(root, source))).resolves.toBeUndefined();
  },
);

it('assigns every source entry to a role, including delegated scalar cells', async () => {
  const packages = path.join(root, 'packages');
  const directories = (await readdir(packages, { withFileTypes: true })).filter(
    (entry) => entry.isDirectory() && entry.name.startsWith('jsonforms-svelte'),
  );
  const files = (
    await Promise.all(
      directories.map(async (entry) =>
        (await readdir(path.join(packages, entry.name, 'src'), { recursive: true })).map(
          (file) => `${entry.name}/src/${file}`,
        ),
      ),
    )
  ).flat();
  const cellDirectories = sources
    .filter((source) => source.endsWith('/cells/index.ts'))
    .map((source) => path.posix.dirname(source) + '/');
  const unmapped = files
    .filter((file) => file.includes('/src/') && file.endsWith('.entry.ts'))
    .map((file) => `packages/${file}`)
    .filter(
      (file) =>
        !sources.includes(file) && !cellDirectories.some((directory) => file.startsWith(directory)),
    );
  expect(unmapped).toEqual([]);
});
