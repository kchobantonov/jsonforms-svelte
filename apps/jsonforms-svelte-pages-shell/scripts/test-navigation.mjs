import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(appDir, 'build');
let mount = { base: '', root: buildDir };
const demos = ['flowbite', 'skeleton', 'shadcn', 'editor'];
const demoSource = (demo) => path.resolve(appDir, '..', `jsonforms-svelte-${demo}-demo`, demo === 'editor' ? 'dist' : 'build');

// Verify the shell copied every artifact without rewriting it.
for (const demo of demos) {
  const source = demoSource(demo);
  for (const file of await readdir(source, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (!file.isFile()) continue;
    const original = path.join(file.parentPath, file.name);
    const copied = path.join(buildDir, demo, path.relative(source, original));
    assert.deepEqual(await readFile(copied), await readFile(original), copied);
  }
}
assert.deepEqual(
  await readFile(path.join(buildDir, 'index.html')),
  await readFile(path.join(appDir, 'src/index.html')),
);

const contentTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.wasm': 'application/wasm',
};
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const { base, root } = mount;
    assert.ok(url.pathname.startsWith(`${base}/`));
    let file = path.resolve(root, `.${decodeURIComponent(url.pathname.slice(base.length))}`);
    assert.ok(file === root || file.startsWith(`${root}${path.sep}`));
    if ((await stat(file)).isDirectory()) {
      if (!url.pathname.endsWith('/')) {
        response.writeHead(301, { Location: `${url.pathname}/${url.search}` }).end();
        return;
      }
      file = path.join(file, 'index.html');
    }
    await stat(file);
    response.writeHead(200, {
      'Content-Type': contentTypes[path.extname(file)] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(response);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
  browser = await chromium.launch();
  const origin = `http://127.0.0.1:${server.address().port}`;
  const scenarios = process.env.DEMO_DEV_URL
    ? [{ demo: process.env.DEMO_NAME, label: 'development', url: process.env.DEMO_DEV_URL }]
    : demos.flatMap((demo) => [
        {
          demo,
          label: 'standalone',
          base: '',
          root: demoSource(demo),
        },
        {
          demo,
          label: 'relocated demo',
          base: '/another/context/copied-demo',
          root: demoSource(demo),
        },
        { demo, label: 'shell', base: '', root: buildDir, shell: true },
        {
          demo,
          label: 'relocated shell',
          base: '/different/nested/context',
          root: buildDir,
          shell: true,
        },
      ]);
  for (const scenario of scenarios.filter(s => !process.env.DEMO_NAME || s.demo === process.env.DEMO_NAME)) {
    const { demo, label } = scenario;
    mount = scenario;
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    if (scenario.url) {
      page.setDefaultTimeout(120000);
      page.setDefaultNavigationTimeout(120000);
    }
    const failures = [];
    page.on('pageerror', (error) => failures.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
    });
    await page.goto(scenario.url ?? `${origin}${scenario.base}/`);
    if (scenario.shell) await page.locator(`a[href="./${demo}/"]`).click();
    if (demo === 'editor') {
      await page.locator('#example').selectOption('presentation-renderers');
      await page.getByRole('radio', { name: 'Validate', exact: true }).click();
      await page.getByRole('region', { name: 'Form Preview', exact: true })
        .getByRole('img', { name: 'Blue circle beside the words Presentation renderers', exact: true }).waitFor();
      await page.reload();
      await page.locator('#integration').selectOption('webcomponent');
      await page.getByRole('complementary', { name: 'Components', exact: true }).waitFor();
      assert.deepEqual(failures, [], `${demo}: browser errors`);
      console.log(`${demo} (${label}): shell link, examples, preview, reload and web component passed`);
      await page.close();
      continue;
    }
    const items =
      demo === 'skeleton' ? page.getByRole('option') : page.locator('aside a[href^="#/examples/"]');
    await items.first().waitFor();
    await page.evaluate(() => {
      window.navigationMarker = true;
    });
    let documents = 0;
    page.on('request', (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) documents++;
    });
    for (const index of [1, 2]) {
      const previous = page.url();
      await items.nth(index).click();
      await page.waitForURL((url) => url.href !== previous);
      await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => window.navigationMarker), true);
    }
    const last = page.url();
    await page.goBack();
    await page.waitForURL((url) => url.href !== last);
    await page.goForward();
    await page.waitForURL(last);
    await page.locator('a[href="#/"]').first().click();
    await page.waitForURL((url) => url.hash === '#/');
    assert.equal(await page.evaluate(() => window.navigationMarker), true);
    assert.equal(documents, 0, `${demo}: navigation requested a new document`);
    // Direct deep links and explicit reloads must also load the built app.
    await page.goto(last);
    await items.first().waitFor();
    await page.reload();
    await items.first().waitFor();
    assert.deepEqual(failures, [], `${demo}: browser errors`);
    console.log(`${demo} (${label}): SPA navigation, deep links, and reload passed`);
    await page.close();
  }
} finally {
  await browser?.close();
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}
