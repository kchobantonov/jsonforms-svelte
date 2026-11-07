import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'webcomponent-time-offset-bounds',
  async ({ page, family, locale, base }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=true`);
    await page.evaluate(
      async ({ family, locale }) => {
        const tag = `jsonforms-svelte-${family}`;
        await customElements.whenDefined(tag);
        const host = document.createElement(tag) as HTMLElement & { changes: unknown[] };
        host.id = 'offset-time-host';
        host.style.cssText =
          'position: fixed; z-index: 99999; top: 90px; left: 320px; width: 600px; min-height: 250px; padding: 20px; background: white;';
        host.changes = [];
        host.addEventListener('change', (event) =>
          host.changes.push((event as CustomEvent).detail),
        );
        host.setAttribute(
          'schema',
          JSON.stringify({
            type: 'object',
            properties: {
              time: {
                type: 'string',
                format: 'time',
                formatMinimum: '09:00:00Z',
                formatExclusiveMaximum: '13:00:00Z',
              },
            },
          }),
        );
        host.setAttribute(
          'uischema',
          JSON.stringify({
            type: 'Control',
            scope: '#/properties/time',
            options: { mask: false, showActions: true, views: ['hours'], timeFormat: 'HH:mm' },
          }),
        );
        host.setAttribute('data', JSON.stringify({ time: '11:00:00Z' }));
        host.setAttribute('locale', locale);
        document.body.append(host);
      },
      { family, locale },
    );

    const host = page.locator('#offset-time-host');
    await host
      .getByRole('button', {
        name: messages[locale][family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'],
        exact: true,
      })
      .click();
    const hour = host.getByRole('spinbutton', {
      name: messages[locale]['temporal.hours'],
      exact: true,
    });
    await hour.waitFor();
    expect(await hour.evaluate((node) => node.getRootNode() instanceof ShadowRoot)).toBe(true);
    const firstHour = Number(await hour.inputValue());
    const step = async (direction: 0 | 1, expectedHour: number) => {
      await hour.evaluate((node, direction) => {
        let parent = node.parentElement!;
        while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
        parent.querySelectorAll<HTMLButtonElement>('button')[direction]!.click();
      }, direction);
      await expect.poll(async () => Number(await hour.inputValue())).toBe(expectedHour);
    };
    await step(0, (firstHour + 1) % 24);
    await hour.evaluate((node) => {
      let parent = node.parentElement!;
      while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
      parent.querySelectorAll<HTMLButtonElement>('button')[0]!.click();
    });
    await expect
      .poll(() => host.getByText(messages[locale]['time.outOfRange']).isVisible())
      .toBe(true);
    expect(Number(await hour.inputValue())).toBe((firstHour + 1) % 24);
    await step(1, firstHour);
    await step(1, (firstHour + 23) % 24);
    await host.getByRole('button', { name: messages[locale]['temporal.ok'], exact: true }).click();
    await expect
      .poll(() =>
        host.evaluate(
          (element) =>
            (element as HTMLElement & { changes: Array<{ data: { time: string } }> }).changes.at(-1)
              ?.data.time,
        ),
      )
      .toMatch(/^\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/);
    expect(pageErrors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
