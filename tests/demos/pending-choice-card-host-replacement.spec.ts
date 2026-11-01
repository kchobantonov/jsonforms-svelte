import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'pending choice-card host replacement',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=true`);
    const original = { code: '{"ok":true}', plan: 'A' };
    const replacement = { code: '{"ok":true}', plan: 'C' };
    await page.evaluate(
      async ({ family, locale, original }) => {
        const tag = `jsonforms-svelte-${family}`;
        await customElements.whenDefined(tag);
        const host = document.createElement(tag);
        host.id = 'pending-choice-card-host';
        host.style.cssText =
          'position:fixed;z-index:9999;top:70px;left:300px;width:700px;background:white;';
        host.setAttribute(
          'schema',
          JSON.stringify({
            type: 'object',
            properties: {
              code: { type: 'string', title: 'Code' },
              plan: { type: 'string', title: 'Plan', enum: ['A', 'B', 'C'] },
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
              { type: 'Control', scope: '#/properties/plan', options: { format: 'cards' } },
            ],
          }),
        );
        host.setAttribute('locale', locale);
        host.setAttribute('data', JSON.stringify(original));
        document.body.append(host);
      },
      { family, locale, original },
    );
    const host = page.locator('#pending-choice-card-host');
    const editor = host.locator('.monaco-editor .inputarea, .monaco-editor .native-edit-context');
    await editor.first().waitFor({ state: 'attached' });
    await host.getByText('B', { exact: true }).waitFor();
    await host.evaluate((element, replacement) => {
      const probe = { triggered: false, settled: false, changes: [] as unknown[] };
      (element as HTMLElement & { choiceCardProbe?: typeof probe }).choiceCardProbe = probe;
      element.addEventListener('change', (event) => {
        probe.changes.push((event as CustomEvent<{ data: unknown }>).detail.data);
      });
      const clickCard = () => {
        const text = [...(element.shadowRoot?.querySelectorAll('span') ?? [])].find(
          (node) => node.textContent?.trim() === 'B',
        );
        const target = text?.closest<HTMLElement>('label,button');
        target?.click();
        return !!target;
      };
      element.addEventListener('validity-change', (event) => {
        const detail = (event as CustomEvent<{ pending: boolean }>).detail;
        if (detail.pending && !probe.triggered) {
          if (!clickCard()) return;
          probe.triggered = true;
          element.setAttribute('data', JSON.stringify(replacement));
        } else if (probe.triggered && !detail.pending) {
          probe.settled = true;
        }
      });
    }, replacement);
    await editor.first().focus();
    await page.keyboard.press('End');
    await page.keyboard.insertText(' ');
    await expect
      .poll(() =>
        host.evaluate(
          (element) =>
            (element as HTMLElement & { choiceCardProbe?: { triggered: boolean } }).choiceCardProbe
              ?.triggered,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        host.evaluate(
          (element) =>
            (element as HTMLElement & { choiceCardProbe?: { settled: boolean } }).choiceCardProbe
              ?.settled,
        ),
      )
      .toBe(true);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
    expect(JSON.parse((await host.getAttribute('data'))!)).toEqual(replacement);
    expect(
      await host.evaluate((element) =>
        (
          element as HTMLElement & { choiceCardProbe?: { changes: { plan: string }[] } }
        ).choiceCardProbe?.changes.some((data) => data?.plan === 'B'),
      ),
    ).toBe(false);

    await host.evaluate((element) => {
      const probe = { triggered: false, changes: [] as { plan: string }[] };
      (element as HTMLElement & { choiceCardPositive?: typeof probe }).choiceCardPositive = probe;
      element.addEventListener('change', (event) => {
        probe.changes.push((event as CustomEvent<{ data: { plan: string } }>).detail.data);
      });
      const onValidity = (event: Event) => {
        if (!(event as CustomEvent<{ pending: boolean }>).detail.pending || probe.triggered) return;
        const text = [...(element.shadowRoot?.querySelectorAll('span') ?? [])].find(
          (node) => node.textContent?.trim() === 'B',
        );
        const target = text?.closest<HTMLElement>('label,button');
        if (!target) return;
        probe.triggered = true;
        target.click();
        element.removeEventListener('validity-change', onValidity);
      };
      element.addEventListener('validity-change', onValidity);
    });
    await editor.first().focus();
    await page.keyboard.press('End');
    await page.keyboard.insertText(' ');
    await expect
      .poll(() =>
        host.evaluate(
          (element) =>
            (element as HTMLElement & { choiceCardPositive?: { triggered: boolean } })
              .choiceCardPositive?.triggered,
        ),
      )
      .toBe(true);
    await expect
      .poll(() =>
        host.evaluate((element) =>
          (
            element as HTMLElement & { choiceCardPositive?: { changes: { plan: string }[] } }
          ).choiceCardPositive?.changes.some((data) => data?.plan === 'B'),
        ),
      )
      .toBe(true);
    expect(pageErrors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 30000 },
);
