import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

const cases = [
  {
    kind: 'date',
    initial: '2026-10-14',
    partial: '2026-10-1',
    replacement: '2026-11-03',
    shown: /^2026-11-03$/,
  },
  {
    kind: 'time',
    initial: '09:30:00Z',
    partial: '09:3',
    replacement: '11:45:00Z',
    shown: /^\d\d:45$/,
  },
  {
    kind: 'date-time',
    initial: '2026-10-14T13:15:00Z',
    partial: '2026-10-1',
    replacement: '2026-11-03T09:30:00Z',
    shown: /^2026-11-03 \d\d:30$/,
  },
] as const;

demoTest(
  'webcomponent-temporal-draft-replacement',
  async ({ page, family, locale, base }) => {
    await page.goto(`${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=true`);
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    for (const item of cases) {
      await page.evaluate(
        async ({ family, locale, item }) => {
          const tag = `jsonforms-svelte-${family}`;
          await customElements.whenDefined(tag);
          const host = document.createElement(tag);
          host.id = 'temporal-draft-host';
          host.setAttribute('schema', JSON.stringify({ type: 'string', format: item.kind }));
          host.setAttribute(
            'uischema',
            JSON.stringify({ type: 'Control', scope: '#', options: { mask: false } }),
          );
          host.setAttribute('data', JSON.stringify(item.initial));
          host.setAttribute('locale', locale);
          host.setAttribute(
            'config',
            JSON.stringify({
              dateFormat: 'YYYY-MM-DD',
              timeFormat: 'HH:mm',
              dateTimeFormat: 'YYYY-MM-DD HH:mm',
            }),
          );
          document.body.append(host);
        },
        { family, locale, item },
      );
      const host = page.locator('#temporal-draft-host');
      const input = host.locator('input[id$="-input"]');
      await input.waitFor();
      await host.evaluate((element) => {
        (element as HTMLElement & { observedChanges: unknown[] }).observedChanges = [];
        element.addEventListener('change', (event) => {
          (element as HTMLElement & { observedChanges: unknown[] }).observedChanges.push(
            (event as CustomEvent).detail,
          );
        });
      });
      await input.fill(item.partial);
      await expect.poll(() => input.inputValue()).toBe(item.partial);
      expect(
        await host.evaluate((element) =>
          JSON.parse((element as HTMLElement & { data: string }).data),
        ),
      ).toBe(item.initial);
      expect(
        await host.evaluate(
          (element) => (element as HTMLElement & { observedChanges: unknown[] }).observedChanges,
        ),
      ).toEqual([]);

      await host.evaluate((element, replacement) => {
        (element as HTMLElement & { data: string }).data = JSON.stringify(replacement);
      }, item.replacement);
      await expect.poll(() => input.inputValue()).toMatch(item.shown);
      const changes = await host.evaluate(
        (element) =>
          (element as HTMLElement & { observedChanges: { data: unknown }[] }).observedChanges,
      );
      expect(changes.every((change) => change.data === item.replacement)).toBe(true);
      await host.evaluate((element) => element.remove());
    }
    expect(pageErrors).toEqual([]);
  },
  { hosts: ['webcomponent'] },
);
