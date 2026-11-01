import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'webcomponent-file-action-permissions',
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
        const host = document.createElement(tag) as HTMLElement & { observedChanges?: unknown[] };
        host.id = 'file-action-permissions-host';
        host.observedChanges = [];
        host.addEventListener('change', (event) =>
          host.observedChanges?.push((event as CustomEvent).detail?.data),
        );
        host.style.cssText =
          'position: fixed; z-index: 99999; top: 80px; left: 320px; width: 650px; padding: 20px; background: white;';
        host.setAttribute(
          'schema',
          JSON.stringify({
            type: 'object',
            properties: {
              documents: { type: 'array', items: { type: 'string', format: 'binary' } },
            },
          }),
        );
        host.setAttribute(
          'uischema',
          JSON.stringify({
            type: 'Control',
            scope: '#/properties/documents',
            label: 'Documents',
            options: { clearable: true },
          }),
        );
        host.setAttribute(
          'data',
          JSON.stringify({ documents: ['data:text/plain;filename=first.txt;base64,YQ=='] }),
        );
        host.setAttribute('config', JSON.stringify({ disableAdd: true, disableRemove: true }));
        host.setAttribute('locale', locale);
        document.body.append(host);
      },
      { family, locale },
    );

    const host = page.locator('#file-action-permissions-host');
    const field = host.locator('[data-file-control]');
    const input = field.locator('input[type="file"]');
    const picker = field.getByRole('button', {
      name: /^Documents: /,
    });
    const remove = field.getByRole('button', {
      name: /^(Remove file|Премахване на файл): first\.txt$/,
    });
    const clear = field.getByRole('button', {
      name: /^(Clear value|Изчистване на стойността)$/,
    });
    await field.waitFor();
    await expect.poll(() => input.isDisabled()).toBe(true);
    await expect.poll(() => picker.isDisabled()).toBe(true);
    await expect.poll(() => remove.isDisabled()).toBe(true);
    await expect.poll(() => clear.isDisabled()).toBe(true);
    const filename = field.locator('span[title="first.txt"]');
    expect(await filename.getAttribute('tabindex')).toBe('0');
    await filename.focus();
    expect(
      await filename.evaluate((element) => {
        const root = element.getRootNode();
        return root instanceof ShadowRoot && root.activeElement === element;
      }),
    ).toBe(true);

    await host.evaluate((element) =>
      element.setAttribute(
        'uischema',
        JSON.stringify({
          type: 'Control',
          scope: '#/properties/documents',
          label: 'Documents',
          options: { clearable: true, disableAdd: false, disableRemove: false },
        }),
      ),
    );
    await expect.poll(() => input.isEnabled()).toBe(true);
    await expect.poll(() => picker.isEnabled()).toBe(true);
    await expect.poll(() => remove.isEnabled()).toBe(true);
    await expect.poll(() => clear.isEnabled()).toBe(true);

    await input.setInputFiles({
      name: 'second.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('b'),
    });
    await field.getByText('second.txt', { exact: true }).waitFor();
    await remove.click();
    await field.getByText('first.txt', { exact: true }).waitFor({ state: 'hidden' });
    await expect
      .poll(() =>
        host.evaluate((element) => {
          const changes = (
            element as HTMLElement & { observedChanges: Array<{ documents: string[] }> }
          ).observedChanges;
          return changes.at(-1)?.documents.length;
        }),
      )
      .toBe(1);

    await host.evaluate((element) =>
      element.setAttribute(
        'uischema',
        JSON.stringify({
          type: 'Control',
          scope: '#/properties/documents',
          label: 'Documents',
          options: { clearable: true },
        }),
      ),
    );
    await host.evaluate((element) =>
      element.setAttribute('config', JSON.stringify({ disableAdd: false, disableRemove: true })),
    );
    await expect.poll(() => input.isEnabled()).toBe(true);
    await expect.poll(() => picker.isEnabled()).toBe(true);
    await expect.poll(() => clear.isDisabled()).toBe(true);
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
