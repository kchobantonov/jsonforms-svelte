import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'pending deletion host replacement',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-destructive-confirmation?use-webcomponent=true`,
    );
    const original = { code: '{"ok":true}', notes: { gate: 'Original' } };
    const replacement = { code: '{"ok":true}', notes: { gate: 'Host replacement' } };
    await page.evaluate(
      async ({ family, locale, original }) => {
        const tag = `jsonforms-svelte-${family}`;
        await customElements.whenDefined(tag);
        const host = document.createElement(tag);
        host.id = 'pending-deletion-host';
        host.style.cssText =
          'position:fixed;z-index:9999;top:70px;left:300px;width:700px;background:white;';
        host.setAttribute(
          'schema',
          JSON.stringify({
            type: 'object',
            properties: {
              code: { type: 'string', title: 'Code' },
              notes: { type: 'object', title: 'Notes', additionalProperties: { type: 'string' } },
            },
          }),
        );
        host.setAttribute(
          'uischema',
          JSON.stringify({
            type: 'VerticalLayout',
            elements: [
              {
                type: 'Control',
                scope: '#/properties/code',
                options: { format: 'code', language: 'json', propagateErrors: true },
              },
              { type: 'Control', scope: '#/properties/notes' },
            ],
          }),
        );
        host.setAttribute(
          'config',
          JSON.stringify({ jsonformsExtended: { confirmation: { default: 'always' } } }),
        );
        host.setAttribute('locale', locale);
        host.setAttribute('data', JSON.stringify(original));
        document.body.append(host);
      },
      { family, locale, original },
    );
    const host = page.locator('#pending-deletion-host');
    const editor = host.locator('.monaco-editor .inputarea, .monaco-editor .native-edit-context');
    await editor.first().waitFor({ state: 'attached' });
    const remove = host
      .locator('[data-additional-properties]')
      .getByRole('button', {
        name: messages[locale]['additionalProperties.deleteNamed'].replace('{name}', 'gate'),
      })
      .first();
    await remove.waitFor();
    await host.evaluate(
      (element, { replacement, removeLabel }) => {
        const probe = { triggered: false, settled: false };
        (element as HTMLElement & { pendingDeleteProbe?: typeof probe }).pendingDeleteProbe = probe;
        element.addEventListener('validity-change', (event) => {
          const detail = (event as CustomEvent<{ pending: boolean }>).detail;
          if (detail.pending && !probe.triggered) {
            const button = element.shadowRoot?.querySelector<HTMLButtonElement>(
              `[data-additional-properties] button[aria-label="${removeLabel}"]`,
            );
            if (!button) return;
            probe.triggered = true;
            button.click();
            element.setAttribute('data', JSON.stringify(replacement));
          } else if (probe.triggered && !detail.pending) {
            probe.settled = true;
          }
        });
      },
      {
        replacement,
        removeLabel: messages[locale]['additionalProperties.deleteNamed'].replace('{name}', 'gate'),
      },
    );
    await editor.first().focus();
    await page.keyboard.press('End');
    await page.keyboard.insertText(' ');
    await expect
      .poll(() =>
        host.evaluate(
          (element) =>
            (element as HTMLElement & { pendingDeleteProbe?: { triggered: boolean } })
              .pendingDeleteProbe?.triggered,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        host.evaluate(
          (element) =>
            (element as HTMLElement & { pendingDeleteProbe?: { settled: boolean } })
              .pendingDeleteProbe?.settled,
        ),
      )
      .toBe(true);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    await expect.poll(() => host.getByRole('dialog').count()).toBe(0);
    expect(JSON.parse((await host.getAttribute('data'))!)).toEqual(replacement);

    await host.evaluate(
      (element, removeLabel) => {
        const probe = { triggered: false };
        (element as HTMLElement & { pendingDeletePositive?: typeof probe }).pendingDeletePositive =
          probe;
        const onValidity = (event: Event) => {
          if (!(event as CustomEvent<{ pending: boolean }>).detail.pending || probe.triggered)
            return;
          const button = element.shadowRoot?.querySelector<HTMLButtonElement>(
            `[data-additional-properties] button[aria-label="${removeLabel}"]`,
          );
          if (!button) return;
          probe.triggered = true;
          button.click();
          element.removeEventListener('validity-change', onValidity);
        };
        element.addEventListener('validity-change', onValidity);
      },
      messages[locale]['additionalProperties.deleteNamed'].replace('{name}', 'gate'),
    );
    await editor.first().focus();
    await page.keyboard.press('End');
    await page.keyboard.insertText(' ');
    await expect
      .poll(() =>
        host.evaluate(
          (element) =>
            (element as HTMLElement & { pendingDeletePositive?: { triggered: boolean } })
              .pendingDeletePositive?.triggered,
        ),
      )
      .toBe(true);
    await expect.poll(() => host.getByRole('dialog').count()).toBe(1);
    expect(JSON.parse((await host.getAttribute('data'))!)).toEqual(replacement);
    expect(pageErrors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 30000 },
);
