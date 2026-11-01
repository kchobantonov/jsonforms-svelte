import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
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
const consumer = mkdtempSync(path.join(tmpdir(), 'jsonforms-packed-core-floor-'));
const write = (file, content) => {
  const destination = path.join(consumer, file);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, content);
};
const run = (command, args) => execFileSync(command, args, { cwd: consumer, stdio: 'inherit' });
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
          lodash: '^4.17.21',
          svelte: '5.20.0',
        },
        devDependencies: {
          '@sveltejs/vite-plugin-svelte': '7.3.1',
          vite: 'npm:@voidzero-dev/vite-plus-core@1.4.0',
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
  run(process.execPath, ['node_modules/vite/dist/vite/node/cli.js', 'build']);

  const dist = path.join(consumer, 'dist');
  server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const file = path.resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(dist + path.sep)) return void response.writeHead(404).end();
    try {
      response.setHeader(
        'Content-Type',
        file.endsWith('.js') ? 'text/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html',
      );
      response.end(readFileSync(file));
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${address.port}/`);
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
