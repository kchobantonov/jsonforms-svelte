import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
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
const [family, ...args] = process.argv.slice(2);
const assets = args.includes('--assets');
const svelteFloor = args.includes('--svelte-floor');
const archiveArgs = args.filter((arg) => arg !== '--assets' && arg !== '--svelte-floor');
assert.ok(['flowbite', 'shadcn', 'skeleton'].includes(family), 'Pass a renderer family');
const minimumSvelte = { flowbite: '5.40.0', shadcn: '5.33.0', skeleton: '5.32.0' };
assert.ok(
  archiveArgs.length === 2 || archiveArgs.length === 4,
  'Pass base and family renderer tarballs, optionally followed by common and family extended tarballs',
);
const [baseArchive, rendererArchive, commonExtendedArchive, familyExtendedArchive] =
  archiveArgs.map((archive) => path.resolve(archive));
const extended = archiveArgs.length === 4;
assert.ok(!assets || extended, 'The asset profile requires both extended tarballs');
assert.ok(
  archiveArgs.every((archive) => existsSync(path.resolve(archive))),
  'All tarballs must exist',
);

const consumer = mkdtempSync(path.join(tmpdir(), `jsonforms-packed-native-${family}-`));
const write = (file, content) => {
  const destination = path.join(consumer, file);
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, content);
};
const run = (command, args) => execFileSync(command, args, { cwd: consumer, stdio: 'inherit' });
let browser;
let server;
try {
  if (family === 'shadcn') {
    mkdirSync(path.join(consumer, 'src/lib/components'), { recursive: true });
    cpSync(
      path.join(root, 'apps/jsonforms-svelte-shadcn-demo/src/lib/components/ui'),
      path.join(consumer, 'src/lib/components/ui'),
      { recursive: true },
    );
  }
  write(
    'package.json',
    JSON.stringify(
      {
        name: `jsonforms-packed-native-${family}-check`,
        version: '1.0.0',
        private: true,
        type: 'module',
        dependencies: {
          '@chobantonov/jsonforms-svelte': `file:${baseArchive}`,
          [`@chobantonov/jsonforms-svelte-${family}`]: `file:${rendererArchive}`,
          ...(extended
            ? {
                '@chobantonov/jsonforms-svelte-extended': `file:${commonExtendedArchive}`,
                [`@chobantonov/jsonforms-svelte-${family}-extended`]: `file:${familyExtendedArchive}`,
                'ag-grid-community': '^36.0.1',
                ajv: '^8.20.0',
                'ajv-errors': '^3.0.0',
                'ajv-i18n': '^4.2.0',
                'ajv-keywords': '^5.1.0',
                dayjs: '^1.10.6',
                lodash: '^4.17.21',
                maska: '^3.2.0',
                'monaco-editor': '^0.55.1',
                ractive: '^1.4.4',
              }
            : {}),
          '@jsonforms/core': jsonFormsCoreVersion,
          clsx: '^2.1.1',
          svelte: svelteFloor ? minimumSvelte[family] : '5.50.1',
          'tailwind-merge': '^3.4.0',
          'tailwind-variants': '^3.2.2',
          ...(family === 'flowbite'
            ? {
                flowbite: '^4.0.1',
                'flowbite-svelte': '^1.31.0',
                'flowbite-svelte-icons': '^3.1.0',
              }
            : family === 'skeleton'
              ? {
                  '@lucide/svelte': '^0.542.0',
                  '@skeletonlabs/skeleton': '^4.12.1',
                  '@skeletonlabs/skeleton-svelte': '^4.12.1',
                }
              : {
                  '@internationalized/date': '^3.12.0',
                  '@lucide/svelte': '^0.542.0',
                  'bits-ui': '^2.19.5',
                  paneforge: '^1.0.2',
                  runed: '0.35.1',
                  'svelte-toolbelt': '0.10.6',
                }),
        },
        devDependencies: {
          '@sveltejs/vite-plugin-svelte': '7.3.1',
          typescript: '5.9.3',
          vite: 'npm:@voidzero-dev/vite-plus-core@1.4.0',
        },
      },
      null,
      2,
    ) + '\n',
  );
  write(
    'index.html',
    '<!doctype html><html><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>',
  );
  write(
    'svelte.config.js',
    "import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';\nexport default { preprocess: vitePreprocess({ script: true }) };\n",
  );
  write(
    'vite.config.ts',
    `import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: { exclude: ['@chobantonov/jsonforms-svelte', '@chobantonov/jsonforms-svelte-${family}'${extended ? ", '@chobantonov/jsonforms-svelte-extended', '@chobantonov/jsonforms-svelte-" + family + "-extended'" : ''}] },
  ssr: { noExternal: ['@chobantonov/jsonforms-svelte', '@chobantonov/jsonforms-svelte-${family}'${extended ? ", '@chobantonov/jsonforms-svelte-extended', '@chobantonov/jsonforms-svelte-" + family + "-extended'" : ''}] },
  resolve: { alias: {
    ${family === 'shadcn' ? "'@jsonforms-svelte-shadcn-ui': path.resolve('src/lib/components/ui')," : ''}
    '$lib': path.resolve('src/lib'),
  } },
});
`,
  );
  write(
    'src/main.ts',
    "import App from './App.svelte';\nimport { mount } from 'svelte';\nmount(App, { target: document.getElementById('app')! });\n",
  );
  write(
    'src/declarations.ts',
    `import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { ${family}Renderers, ${family}Cells } from '@chobantonov/jsonforms-svelte-${family}';
${extended ? `import { ${family}ExtendedRenderers, ${family}ExtendedCells } from '@chobantonov/jsonforms-svelte-${family}-extended';` : ''}
import * as baseApi from '@chobantonov/jsonforms-svelte';
import * as rendererApi from '@chobantonov/jsonforms-svelte-${family}';
${
  extended
    ? `import * as commonExtendedApi from '@chobantonov/jsonforms-svelte-extended';
import * as familyExtendedApi from '@chobantonov/jsonforms-svelte-${family}-extended';`
    : ''
}
export const formComponent: typeof JsonForms = JsonForms;
export const renderers = [...${family}Renderers${extended ? `, ...${family}ExtendedRenderers` : ''}];
export const cells = [...${family}Cells${extended ? `, ...${family}ExtendedCells` : ''}];
export const exportedApi = { baseApi, rendererApi${extended ? ', commonExtendedApi, familyExtendedApi' : ''} };
`,
  );
  write(
    'tsconfig.declarations.json',
    JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        allowImportingTsExtensions: true,
        noEmit: true,
        strict: true,
        skipLibCheck: false,
        types: [],
      },
      files: ['src/declarations.ts'],
    }),
  );
  write(
    'src/App.svelte',
    `<script lang="ts">
  import { JsonForms } from '@chobantonov/jsonforms-svelte';
  import { ${family}Renderers, ${family}Cells } from '@chobantonov/jsonforms-svelte-${family}';
  ${extended ? `import { ${family}ExtendedRenderers, ${family}ExtendedCells } from '@chobantonov/jsonforms-svelte-${family}-extended';` : ''}
  let data = $state({ name: 'Ada'${extended ? ", swatch: '#ff0000'" : ''}${assets ? ", code: 'const x = 1;', items: [{ name: 'One' }]" : ''} });
  const schema = { type: 'object', properties: { name: { type: 'string' }${extended ? ", swatch: { type: 'string', format: 'color' }" : ''}${assets ? ", code: { type: 'string' }, items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' } } } }" : ''} } };
  const uischema = ${extended ? `{ type: 'VerticalLayout', elements: [{ type: 'Control', scope: '#/properties/name' }, { type: 'Control', scope: '#/properties/swatch' }${assets ? ", { type: 'Control', scope: '#/properties/code', options: { format: 'code', language: 'javascript' } }, { type: 'Control', scope: '#/properties/items', options: { variant: 'ag-grid' } }" : ''}] }` : "{ type: 'Control', scope: '#/properties/name' }"};
  const renderers = [ ...${family}Renderers${extended ? `, ...${family}ExtendedRenderers` : ''} ];
  const cells = [ ...${family}Cells${extended ? `, ...${family}ExtendedCells` : ''} ];
</script>
<JsonForms {schema} {uischema} {data} {renderers} {cells} onchange={(event) => (data = event.data as typeof data)} />
<output data-testid="form-data">{JSON.stringify(data)}</output>
`,
  );

  const installArgs = ['install', '--ignore-scripts'];
  if (process.env.JSONFORMS_PACKED_OFFLINE === '1') installArgs.push('--offline');
  if (process.env.JSONFORMS_PACKED_STORE_DIR)
    installArgs.push('--store-dir', process.env.JSONFORMS_PACKED_STORE_DIR);
  run('pnpm', installArgs);
  if (svelteFloor) {
    const installed = JSON.parse(
      readFileSync(path.join(consumer, 'node_modules/svelte/package.json')),
    );
    assert.equal(
      installed.version,
      minimumSvelte[family],
      'Consumer must use the exact peer floor',
    );
  }
  const typecheck = spawnSync(
    process.execPath,
    ['node_modules/typescript/bin/tsc', '--project', 'tsconfig.declarations.json'],
    { cwd: consumer, encoding: 'utf8' },
  );
  const diagnostics = `${typecheck.stdout ?? ''}${typecheck.stderr ?? ''}`
    .split('\n')
    .filter((line) => line.includes('error TS'));
  const upstreamDiagnostics = diagnostics.filter(
    (line) =>
      line.includes('/@jsonforms/core/lib/store/type.d.ts') ||
      line.includes('/ractive/typings/ractive.d.ts') ||
      line.includes('/apexcharts/types/apexcharts.d.ts') ||
      line.includes('/flowbite-svelte/dist/'),
  );
  assert.ok(
    typecheck.status === 0 ||
      (diagnostics.length > 0 && upstreamDiagnostics.length === diagnostics.length),
    `Packed declaration check failed:\n${typecheck.stdout ?? ''}${typecheck.stderr ?? ''}`,
  );
  if (upstreamDiagnostics.length)
    console.warn(
      `Strict declaration check has ${upstreamDiagnostics.length} known upstream diagnostics`,
    );
  run(process.execPath, ['node_modules/vite/dist/vite/node/cli.js', 'build']);

  const dist = path.join(consumer, 'dist');
  server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    const file = path.resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(dist + path.sep)) {
      response.writeHead(404).end();
      return;
    }
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
  const workerUrls = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('worker', (worker) => workerUrls.push(worker.url()));
  await page.goto(`http://127.0.0.1:${address.port}/`);
  const expectedData = {
    name: 'Ada',
    ...(extended ? { swatch: '#ff0000' } : {}),
    ...(assets ? { code: 'const x = 1;', items: [{ name: 'One' }] } : {}),
  };
  const input = page.getByRole('textbox').first();
  await input.waitFor();
  assert.equal(await input.inputValue(), 'Ada');
  assert.equal(await page.getByTestId('form-data').textContent(), JSON.stringify(expectedData));
  if (extended) assert.equal(await page.locator('[data-color-picker-wrapper]').count(), 1);
  if (assets) {
    await page.locator('.monaco-editor').first().waitFor();
    await page.locator('.ag-root-wrapper').first().waitFor();
    assert.ok(
      (await page.locator('style#jsonforms-monaco-editor-styles').textContent())?.includes(
        '.monaco-editor',
      ),
      'Packaged Monaco CSS must be installed in the consumer document',
    );
    assert.ok(
      (
        await page.locator(`style#jsonforms-${family}-ag-grid-runtime-styles`).textContent()
      )?.includes('.jsonforms-ag-grid'),
      'Packaged AG Grid CSS must be installed in the consumer document',
    );
    assert.equal(
      await page
        .locator('.jsonforms-ag-grid__toolbar')
        .first()
        .evaluate(
          (element) => element.ownerDocument.defaultView?.getComputedStyle(element).display,
        ),
      'flex',
    );
    assert.ok(
      workerUrls.some((url) => url.includes('editor.worker')),
      'A packaged Monaco worker must start',
    );
    const gridInput = page.locator('.ag-row[row-index="0"] .ag-cell[col-id="name"] input');
    await gridInput.waitFor();
    await gridInput.fill('Two');
    await gridInput.blur();
    expectedData.items[0].name = 'Two';
    await page.waitForFunction(
      () =>
        JSON.parse(globalThis.document.querySelector('[data-testid="form-data"]').textContent)
          .items[0].name === 'Two',
    );
    const editorInput = page
      .locator('.monaco-editor .inputarea, .monaco-editor .native-edit-context')
      .first();
    await editorInput.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await editorInput.evaluate((element) => {
      const view = element.ownerDocument.defaultView;
      const clipboardData = new view.DataTransfer();
      clipboardData.setData('text/plain', 'const x = 2;');
      element.dispatchEvent(
        new view.ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await editorInput.blur();
    expectedData.code = 'const x = 2;';
    await page.waitForFunction(
      () =>
        JSON.parse(globalThis.document.querySelector('[data-testid="form-data"]').textContent)
          .code === 'const x = 2;',
    );
  }
  await input.fill('Grace');
  await page.getByTestId('form-data').getByText(/Grace/).waitFor();
  expectedData.name = 'Grace';
  assert.equal(await page.getByTestId('form-data').textContent(), JSON.stringify(expectedData));
  assert.deepEqual(errors, []);
  console.log(
    `Packed ${family}${extended ? ' extended' : ''}${assets ? ' assets' : ''}${svelteFloor ? ` Svelte ${minimumSvelte[family]}` : ''} native consumer: build and exact-data browser edit passed`,
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server?.close(resolve) ?? resolve());
  rmSync(consumer, { recursive: true, force: true });
}
