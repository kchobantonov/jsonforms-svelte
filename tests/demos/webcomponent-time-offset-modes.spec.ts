import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'webcomponent-time-offset-modes',
  async ({ page, family, locale, base }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=true`);
    const honolulu =
      (await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone)) ===
      'Pacific/Honolulu';
    const initialMinimum = honolulu ? '00:00:00' : '09:00:00Z';
    const raisedMinimum = honolulu ? '01:00:00' : '11:00:00Z';

    const mount = async (id: string, restrict: boolean, minimum = '09:00:00Z') => {
      await page.evaluate(
        async ({ family, locale, id, restrict, minimum }) => {
          const tag = `jsonforms-svelte-${family}`;
          await customElements.whenDefined(tag);
          const host = document.createElement(tag) as HTMLElement & { changes: unknown[] };
          host.id = id;
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
                min: { type: 'string' },
                time: {
                  type: 'string',
                  format: 'time',
                  formatMinimum: { $data: '1/min' },
                  formatMaximum: '13:00:00Z',
                },
              },
            }),
          );
          host.setAttribute(
            'uischema',
            JSON.stringify({
              type: 'Control',
              scope: '#/properties/time',
              options: {
                mask: false,
                showActions: false,
                restrict,
                views: ['hours'],
                timeFormat: 'HH:mm',
                timeSaveFormat: 'HH:mm:ss.SSSZ',
              },
            }),
          );
          host.setAttribute('data', JSON.stringify({ min: minimum, time: '11:00:00Z' }));
          host.setAttribute('locale', locale);
          document.body.append(host);
        },
        { family, locale, id, restrict, minimum },
      );
      const host = page.locator(`#${id}`);
      await host
        .getByRole('button', {
          name: messages[locale][
            family === 'flowbite' ? 'temporal.openTime' : 'temporal.chooseTime'
          ],
          exact: true,
        })
        .click();
      const hour = host.getByRole('spinbutton', {
        name: messages[locale]['temporal.hours'],
        exact: true,
      });
      await hour.waitFor();
      return { host, hour };
    };
    const stepDown = async (hour: Awaited<ReturnType<typeof mount>>['hour']) => {
      await hour.evaluate((node) => {
        let parent = node.parentElement!;
        while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
        parent.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
      });
    };
    const lastChange = (id: string) =>
      page.locator(`#${id}`).evaluate((element) =>
        (
          element as HTMLElement & {
            changes: Array<{ data: { time: string }; errors?: unknown[] }>;
          }
        ).changes.at(-1),
      );

    const bounded = await mount('bounded-time-host', true, initialMinimum);
    const initialHour = Number(await bounded.hour.inputValue());
    await stepDown(bounded.hour);
    await expect
      .poll(async () =>
        new Date(`2020-01-01T${(await lastChange('bounded-time-host'))?.data.time}`).toISOString(),
      )
      .toBe('2020-01-01T10:00:00.000Z');
    expect((await lastChange('bounded-time-host'))?.data.time).toMatch(
      /^\d{2}:00:00\.000(?:Z|[+-]\d{2}:\d{2})$/,
    );
    expect(
      await bounded.host.getByRole('button', { name: messages[locale]['temporal.ok'] }).count(),
    ).toBe(0);
    await bounded.host.evaluate((element, minimum) => {
      element.setAttribute('data', JSON.stringify({ min: minimum, time: '11:00:00Z' }));
    }, raisedMinimum);
    await expect.poll(async () => Number(await bounded.hour.inputValue())).toBe(initialHour);
    const beforeRejected = await bounded.host.evaluate(
      (element) => (element as HTMLElement & { changes: unknown[] }).changes.length,
    );
    await stepDown(bounded.hour);
    await expect
      .poll(() => bounded.host.getByText(messages[locale]['time.outOfRange']).isVisible())
      .toBe(true);
    expect(Number(await bounded.hour.inputValue())).toBe(initialHour);
    expect(
      await bounded.host.evaluate(
        (element) => (element as HTMLElement & { changes: unknown[] }).changes.length,
      ),
    ).toBe(beforeRejected);
    await bounded.host.evaluate((element) => element.remove());

    const unrestricted = await mount('unrestricted-time-host', false, raisedMinimum);
    await stepDown(unrestricted.hour);
    await expect
      .poll(async () =>
        new Date(
          `2020-01-01T${(await lastChange('unrestricted-time-host'))?.data.time}`,
        ).toISOString(),
      )
      .toBe('2020-01-01T10:00:00.000Z');
    await expect
      .poll(async () => (await lastChange('unrestricted-time-host'))?.errors)
      .toEqual(expect.arrayContaining([expect.objectContaining({ instancePath: '/time' })]));
    expect(pageErrors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
