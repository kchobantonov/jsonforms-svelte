import assert from 'node:assert/strict';
import { createPackedConsumer } from './packed-consumer-server.mjs';
import { readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const requireFromCorePackage = createRequire(
  path.join(root, 'packages/jsonforms-svelte/package.json'),
);
const jsonFormsCoreVersion = requireFromCorePackage('@jsonforms/core/package.json').version;
const archive = path.resolve(process.argv[2] ?? '');
assert.ok(archive.endsWith('.tgz'), 'Pass a packed core tarball');
const { consumer, run, write, buildAndServe } = createPackedConsumer('core-floor');
let server;
let browser;
try {
  write(
    'package.json',
    JSON.stringify(
      {
        name: 'jsonforms-packed-core-floor-check',
        version: '1.0.0',
        private: true,
        type: 'module',
        dependencies: {
          '@chobantonov/jsonforms-svelte': `file:${archive}`,
          '@jsonforms/core': jsonFormsCoreVersion,
          ajv: '^8.20.0',
          svelte: '5.20.0',
        },
        devDependencies: {
          '@sveltejs/vite-plugin-svelte': '7.3.1',
          vite: 'npm:@voidzero-dev/vite-plus-core@8.3.8001',
        },
      },
      null,
      2,
    ) + '\n',
  );
  write(
    'vite.config.js',
    `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: { exclude: ['@chobantonov/jsonforms-svelte'] },
  ssr: { noExternal: ['@chobantonov/jsonforms-svelte'] },
});
`,
  );
  write(
    'index.html',
    '<!doctype html><html><body><div id="app"></div><script type="module" src="/src/main.js"></script></body></html>',
  );
  write(
    'src/main.js',
    "import { mount } from 'svelte';\nimport App from './App.svelte';\nmount(App, { target: document.getElementById('app') });\n",
  );
  write(
    'src/NameRenderer.svelte',
    `<script>
  import { useDispatch, useJsonForms } from '@chobantonov/jsonforms-svelte';
  import { update } from '@jsonforms/core';
  const dispatch = useDispatch();
  const form = useJsonForms();
  const value = $derived(form.core?.data?.name ?? '');
</script>
<input aria-label="Name" {value} oninput={(event) => dispatch(update('name', () => event.currentTarget.value))} />
`,
  );
  write(
    'src/App.svelte',
    `<script>
  import { JsonForms } from '@chobantonov/jsonforms-svelte';
  import NameRenderer from './NameRenderer.svelte';
  let data = $state({ name: 'Ada' });
  const schema = { type: 'object', properties: { name: { type: 'string' } } };
  const uischema = { type: 'Control', scope: '#/properties/name' };
  const renderers = [{ tester: () => 1, renderer: NameRenderer }];
</script>
<JsonForms {schema} {uischema} {data} {renderers} onchange={(event) => (data = event.data)} />
<output data-testid="form-data">{JSON.stringify(data)}</output>
`,
  );

  run('pnpm', ['install', '--ignore-scripts']);
  const installed = JSON.parse(
    readFileSync(path.join(consumer, 'node_modules/svelte/package.json')),
  );
  assert.equal(installed.version, '5.20.0');
  const host = await buildAndServe();
  server = host.server;
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(host.url);
  const input = page.getByRole('textbox', { name: 'Name' });
  await input.waitFor();
  assert.equal(await input.inputValue(), 'Ada');
  await input.fill('Grace');
  await page.getByTestId('form-data').getByText('{"name":"Grace"}', { exact: true }).waitFor();
  assert.equal(await page.getByTestId('form-data').textContent(), '{"name":"Grace"}');
  assert.deepEqual(errors, []);
  console.log(
    'Packed core native consumer: Svelte 5.20.0 build and exact-data browser edit passed',
  );
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  rmSync(consumer, { recursive: true, force: true });
}
