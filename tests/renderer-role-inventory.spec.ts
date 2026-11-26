import { readdir, access } from 'node:fs/promises';
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
