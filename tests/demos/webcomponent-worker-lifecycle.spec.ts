import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

const devFamily = process.env.JSONFORMS_DEMO_FAMILY;
const families =
  devFamily === 'flowbite' || devFamily === 'shadcn' || devFamily === 'skeleton'
    ? ([devFamily] as const)
    : undefined;

demoTest(
  'webcomponent-worker-lifecycle',
  async ({ page, family, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    const origin = process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`;
    await page.goto(`${origin}#/examples/spec-cron-control?use-webcomponent=true`);
    await page.evaluate(async (family) => {
      const tag = `jsonforms-svelte-${family}`;
      await customElements.whenDefined(tag);
      const host = document.createElement(tag) as HTMLElement & { changes?: unknown[] };
      host.id = 'worker-lifecycle-test';
      host.style.cssText =
        'position: fixed; z-index: 99999; top: 100px; left: 300px; width: 650px; background: white;';
      host.changes = [];
      host.addEventListener('change', (event) => host.changes?.push((event as CustomEvent).detail));
      host.setAttribute(
        'schema',
        JSON.stringify({ type: 'object', properties: { code: { type: 'string' } } }),
      );
      host.setAttribute(
        'uischema',
        JSON.stringify({
          type: 'Control',
          scope: '#/properties/code',
          options: { format: 'code', language: 'json' },
        }),
      );
      host.setAttribute('data', JSON.stringify({ code: '{"n":1}' }));
      document.body.append(host);
    }, family);

    const host = page.locator('#worker-lifecycle-test');
    const editor = host.locator('.jsonforms-monaco-editor');
    await editor.locator('.view-lines').waitFor();
    await host.evaluate((element) => {
      element.remove();
      document.body.append(element);
    });
    const editorInput = editor.locator('.inputarea, .native-edit-context');
    await editorInput.waitFor({ state: 'attached' });
    await editorInput.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await editorInput.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData('text/plain', '{"n":2}');
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await page.waitForFunction(() => {
      const host = document.querySelector('#worker-lifecycle-test') as
        | (HTMLElement & { changes?: Array<{ data?: { code?: string } }> })
        | null;
      return host?.changes?.some((change) => change.data?.code === '{"n":2}');
    });
    expect(errors).toEqual([]);

    await host.evaluate((element) => {
      const form = element as HTMLElement & { changes?: unknown[] };
      form.remove();
      form.changes = [];
      form.setAttribute(
        'schema',
        JSON.stringify({
          type: 'object',
          properties: {
            tickets: {
              type: 'array',
              items: {
                type: 'object',
                required: ['code'],
                properties: { code: { type: 'string' } },
              },
            },
          },
        }),
      );
      form.setAttribute(
        'uischema',
        JSON.stringify({
          type: 'Control',
          scope: '#/properties/tickets',
          options: { variant: 'ag-grid', showSortButtons: true },
        }),
      );
      form.setAttribute('data', JSON.stringify({ tickets: [{ code: 'A' }] }));
      document.body.append(form);
    });
    const grid = host.locator('.ag-root');
    await grid.waitFor();
    const gridShell = host.locator('.jsonforms-ag-grid');
    await host.evaluate((element) => element.setAttribute('mode', 'light'));
    await expect
      .poll(() => host.evaluate((element) => getComputedStyle(element).colorScheme))
      .toBe('light');
    const lightBackground = await gridShell.evaluate(
      (element) => getComputedStyle(element).backgroundColor,
    );
    await host.evaluate((element) => element.setAttribute('mode', 'dark'));
    await expect
      .poll(() => host.evaluate((element) => getComputedStyle(element).colorScheme))
      .toBe('dark');
    await expect
      .poll(() => gridShell.evaluate((element) => getComputedStyle(element).backgroundColor))
      .not.toBe(lightBackground);
    await host.evaluate((element) => element.setAttribute('mode', 'light'));
    await expect
      .poll(() => grid.locator('.ag-header-cell[col-id="code"] .ag-header-cell-text').textContent())
      .toBe('Code *');
    await expect.poll(() => grid.locator('.ag-drag-handle').count()).toBe(1);
    await host.evaluate((element) => element.setAttribute('readonly', 'true'));
    await expect.poll(() => grid.locator('.ag-drag-handle').count()).toBe(0);
    await host.evaluate((element) => element.setAttribute('readonly', 'false'));
    await expect.poll(() => grid.locator('.ag-drag-handle').count()).toBe(1);
    const gridStyle = `#jsonforms-${family}-ag-grid-runtime-styles`;
    const shadow = await host.evaluateHandle((element) => element.shadowRoot!);
    await expect
      .poll(() =>
        shadow.evaluate((root, selector) => root.querySelectorAll(selector).length, gridStyle),
      )
      .toBe(1);
    expect(errors).toEqual([]);
    await host.evaluate((element) => {
      element.remove();
      document.body.append(element);
    });
    await expect
      .poll(() =>
        shadow.evaluate((root, selector) => root.querySelectorAll(selector).length, gridStyle),
      )
      .toBe(1);
    const code = grid.locator('.ag-row[row-index="0"] .ag-cell[col-id="code"] input');
    await code.waitFor();
    await code.fill('B');
    await code.blur();
    await page.waitForFunction(() => {
      const host = document.querySelector('#worker-lifecycle-test') as
        | (HTMLElement & { changes?: Array<{ data?: { tickets?: Array<{ code?: string }> } }> })
        | null;
      return host?.changes?.some((change) => change.data?.tickets?.[0]?.code === 'B');
    });
    expect(errors).toEqual([]);
    await host.evaluate((element) => element.remove());
    await expect
      .poll(() =>
        shadow.evaluate((root, selector) => root.querySelectorAll(selector).length, gridStyle),
      )
      .toBe(0);
  },
  { families, locales: ['en'], hosts: ['webcomponent'], timeout: 45_000 },
);
