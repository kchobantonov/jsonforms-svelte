import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'webcomponent-file-size-bounds',
  async ({ page, family, locale, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.goto(`${base}/${family}/#/examples/spec-file-control?use-webcomponent=true`);
    await page.evaluate(
      async ({ family, locale }) => {
        const tag = `jsonforms-svelte-${family}`;
        await customElements.whenDefined(tag);
        const host = document.createElement(tag) as HTMLElement & { changes: unknown[] };
        host.id = 'file-size-bounds-host';
        host.style.cssText =
          'position: fixed; z-index: 99999; top: 80px; left: 320px; width: 650px; padding: 20px; background: white;';
        host.changes = [];
        host.addEventListener('change', (event) =>
          host.changes.push((event as CustomEvent).detail?.data),
        );
        host.setAttribute(
          'schema',
          JSON.stringify({
            type: 'object',
            properties: { attachment: { type: 'string', format: 'byte' } },
          }),
        );
        host.setAttribute(
          'uischema',
          JSON.stringify({
            type: 'Control',
            scope: '#/properties/attachment',
            label: 'Attachment',
            options: { formatMaximum: 6, formatExclusiveMaximum: 5 },
          }),
        );
        host.setAttribute('data', JSON.stringify({ attachment: '' }));
        host.setAttribute('locale', locale);
        document.body.append(host);
      },
      { family, locale },
    );

    const host = page.locator('#file-size-bounds-host');
    const field = host.locator('[data-file-control]');
    const input = field.locator('input[type="file"]');
    await field.waitFor();
    const before = await host.evaluate(
      (element) => (element as HTMLElement & { changes: unknown[] }).changes.length,
    );
    await input.setInputFiles({
      name: 'boundary.bin',
      mimeType: 'application/octet-stream',
      buffer: Buffer.alloc(5),
    });
    await host.getByRole('status').waitFor();
    expect(
      await host.evaluate(
        (element) => (element as HTMLElement & { changes: unknown[] }).changes.length,
      ),
    ).toBe(before);
    await input.setInputFiles({
      name: 'accepted.bin',
      mimeType: 'application/octet-stream',
      buffer: Buffer.alloc(4),
    });
    await expect
      .poll(() =>
        host.evaluate(
          (element) =>
            (element as HTMLElement & { changes: Array<{ attachment: string }> }).changes.at(-1)
              ?.attachment,
        ),
      )
      .toBe('AAAAAA==');
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
