import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'webcomponent-date-time-repeated-hour',
  async ({ page, family, locale, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=true`);
    await page.evaluate(
      async ({ family, locale }) => {
        const tag = `jsonforms-svelte-${family}`;
        await customElements.whenDefined(tag);
        const host = document.createElement(tag) as HTMLElement & {
          changes: Array<{ event: string }>;
        };
        host.id = 'repeated-hour-host';
        host.style.cssText =
          'position: fixed; z-index: 99999; top: 90px; left: 320px; width: 600px; min-height: 250px; padding: 20px; background: white;';
        host.changes = [];
        host.addEventListener('change', (event) =>
          host.changes.push((event as CustomEvent).detail?.data),
        );
        host.setAttribute(
          'schema',
          JSON.stringify({
            type: 'object',
            properties: {
              event: {
                type: 'string',
                format: 'date-time',
                formatMinimum: '2026-11-01T01:30:00-05:00',
                formatMaximum: '2026-11-01T01:45:00-05:00',
              },
            },
          }),
        );
        host.setAttribute(
          'uischema',
          JSON.stringify({
            type: 'Control',
            scope: '#/properties/event',
            label: 'Event',
            options: {
              showActions: true,
              mask: false,
              dateTimeFormat: 'YYYY-MM-DD HH:mm:ss',
              dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ssZ',
            },
          }),
        );
        host.setAttribute('data', JSON.stringify({ event: '2026-11-01T01:30:00-05:00' }));
        host.setAttribute('locale', locale);
        document.body.append(host);
      },
      { family, locale },
    );

    const host = page.locator('#repeated-hour-host');
    const displayAt = (value: string) =>
      page.evaluate((text) => {
        const date = new Date(text);
        const pad = (value: number) => String(value).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
      }, value);
    const expectedDisplay = await displayAt('2026-11-01T01:30:00-05:00');
    await expect.poll(() => host.locator('input').first().inputValue()).toBe(expectedDisplay);
    await host
      .getByRole('button', {
        name: messages[locale][
          family === 'flowbite' ? 'temporal.openDateTime' : 'temporal.chooseDateTime'
        ],
        exact: true,
      })
      .click();
    const apply = host.getByRole('button', {
      name: messages[locale]['temporal.ok'],
      exact: true,
    });
    await expect.poll(() => apply.isEnabled()).toBe(true);
    expect(await apply.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    await host
      .getByRole('spinbutton', { name: messages[locale]['temporal.minutes'], exact: true })
      .fill('31');
    await expect.poll(() => apply.isEnabled()).toBe(true);
    await apply.click();
    await expect
      .poll(() => host.locator('input').first().inputValue())
      .toBe(await displayAt('2026-11-01T06:31:00Z'));
    await expect
      .poll(() =>
        host.evaluate(
          (element) =>
            (element as HTMLElement & { changes: Array<{ event: string }> }).changes.at(-1)?.event,
        ),
      )
      .toBeTruthy();
    const saved = await host.evaluate(
      (element) =>
        (element as HTMLElement & { changes: Array<{ event: string }> }).changes.at(-1)!.event,
    );
    expect(new Date(saved).toISOString()).toBe('2026-11-01T06:31:00.000Z');
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
