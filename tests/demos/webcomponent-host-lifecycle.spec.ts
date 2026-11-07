import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

const devFamily = process.env.JSONFORMS_DEMO_FAMILY;
const families =
  devFamily === 'flowbite' || devFamily === 'shadcn' || devFamily === 'skeleton'
    ? ([devFamily] as const)
    : undefined;

demoTest(
  'webcomponent-host-lifecycle',
  async ({ page, family, base }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
    const origin = process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`;
    await page.goto(`${origin}#/examples/spec-cron-control?use-webcomponent=true`);
    await page.locator(`jsonforms-svelte-${family}`).waitFor();

    await page.evaluate(async (family) => {
      const tag = `jsonforms-svelte-${family}`;
      await customElements.whenDefined(tag);
      const host = document.createElement(tag) as HTMLElement & {
        observedChanges?: unknown[];
      };
      host.id = 'host-lifecycle-test';
      host.style.cssText =
        'position: fixed; z-index: 99999; top: 100px; left: 300px; width: 500px; background: white;';
      host.observedChanges = [];
      host.addEventListener('change', (event) => {
        host.observedChanges?.push((event as CustomEvent).detail);
      });
      host.setAttribute('schema', JSON.stringify({ type: 'string' }));
      host.setAttribute(
        'uischema',
        JSON.stringify({ type: 'Control', scope: '#', label: 'Value', i18n: 'value' }),
      );
      host.setAttribute(
        'translations',
        JSON.stringify({
          en: { 'value.label': 'Value' },
          bg: { 'value.label': 'Стойност' },
        }),
      );
      host.setAttribute('data', JSON.stringify('initial'));
      host.setAttribute('config', JSON.stringify({ restrict: false }));
      host.setAttribute('readonly', 'false');
      host.setAttribute('locale', 'en');
      host.setAttribute('mode', 'dark');
      document.body.append(host);
    }, family);

    const host = page.locator('#host-lifecycle-test');
    const input = host.getByRole('textbox', { name: 'Value', exact: true });
    await input.waitFor();
    expect(await input.inputValue()).toBe('initial');
    expect(await host.getAttribute('data-mode')).toBe('dark');
    expect(await host.evaluate((element) => getComputedStyle(element).colorScheme)).toBe('dark');

    await host.evaluate((element) => {
      const probe = document.createElement('input');
      probe.id = 'outside-style-probe';
      document.body.append(probe);
      (element as HTMLElement & { customStyle: string }).customStyle =
        'input { color: rgb(17, 34, 51) !important; }';
    });
    await page.waitForFunction(() => {
      const inside = document
        .querySelector('#host-lifecycle-test')
        ?.shadowRoot?.querySelector('input');
      return inside && getComputedStyle(inside).color === 'rgb(17, 34, 51)';
    });
    expect(
      await page
        .locator('#outside-style-probe')
        .evaluate((element) => getComputedStyle(element).color),
    ).not.toBe('rgb(17, 34, 51)');
    await host.evaluate((element) => {
      (element as HTMLElement & { customStyle: string }).customStyle =
        'input { color: rgb(51, 34, 17) !important; }';
      document.querySelector('#outside-style-probe')?.remove();
    });
    await page.waitForFunction(() => {
      const inside = document
        .querySelector('#host-lifecycle-test')
        ?.shadowRoot?.querySelector('input');
      return inside && getComputedStyle(inside).color === 'rgb(51, 34, 17)';
    });

    await page.evaluate((family) => {
      const sibling = document.createElement(`jsonforms-svelte-${family}`);
      sibling.id = 'host-lifecycle-sibling';
      sibling.setAttribute('schema', JSON.stringify({ type: 'string' }));
      sibling.setAttribute('uischema', JSON.stringify({ type: 'Control', scope: '#' }));
      sibling.setAttribute('data', JSON.stringify('sibling'));
      sibling.setAttribute('mode', 'light');
      (sibling as HTMLElement & { customStyle: string }).customStyle =
        'input { color: rgb(71, 32, 91) !important; }';
      document.body.append(sibling);
    }, family);
    await page.waitForFunction(() => {
      const input = document
        .querySelector('#host-lifecycle-sibling')
        ?.shadowRoot?.querySelector('input');
      return input && getComputedStyle(input).color === 'rgb(71, 32, 91)';
    });
    expect(
      await host.evaluate(
        (element) => getComputedStyle(element.shadowRoot!.querySelector('input')!).color,
      ),
    ).toBe('rgb(51, 34, 17)');
    expect(await host.evaluate((element) => getComputedStyle(element).colorScheme)).toBe('dark');
    expect(
      await page
        .locator('#host-lifecycle-sibling')
        .evaluate((element) => getComputedStyle(element).colorScheme),
    ).toBe('light');
    await host.evaluate((element) => {
      (element as HTMLElement & { customStyle: string }).customStyle = '';
    });
    await page.waitForFunction(() => {
      const input = document
        .querySelector('#host-lifecycle-test')
        ?.shadowRoot?.querySelector('input');
      return input && getComputedStyle(input).color !== 'rgb(51, 34, 17)';
    });
    expect(
      await page
        .locator('#host-lifecycle-sibling')
        .evaluate((element) => getComputedStyle(element.shadowRoot!.querySelector('input')!).color),
    ).toBe('rgb(71, 32, 91)');
    await page.locator('#host-lifecycle-sibling').evaluate((element) => element.remove());

    await host.evaluate((element) => element.setAttribute('data', JSON.stringify('updated')));
    await page.waitForFunction(
      () =>
        document.querySelector('#host-lifecycle-test')?.shadowRoot?.querySelector('input')
          ?.value === 'updated',
    );
    await host.evaluate((element) => element.setAttribute('readonly', 'true'));
    expect(await input.isEditable()).toBe(false);
    await host.evaluate((element) => {
      element.setAttribute('readonly', 'false');
      element.setAttribute('locale', 'bg');
      element.setAttribute('mode', 'light');
    });
    const bulgarianInput = host.getByRole('textbox', { name: 'Стойност', exact: true });
    await bulgarianInput.waitFor();
    expect(await bulgarianInput.isEditable()).toBe(true);
    expect(await host.getAttribute('data-mode')).toBe('light');
    expect(await host.evaluate((element) => getComputedStyle(element).colorScheme)).toBe('light');

    await page.emulateMedia({ colorScheme: 'dark' });
    await host.evaluate((element) => element.setAttribute('mode', 'system'));
    await page.waitForFunction(() => {
      const host = document.querySelector('#host-lifecycle-test');
      return (
        host?.getAttribute('data-mode') === 'system' &&
        getComputedStyle(host).colorScheme === 'dark'
      );
    });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.waitForFunction(() => {
      const host = document.querySelector('#host-lifecycle-test');
      return host && getComputedStyle(host).colorScheme === 'light';
    });

    await host.evaluate((element) => {
      element.remove();
      document.body.append(element);
    });
    await bulgarianInput.waitFor();
    expect(await bulgarianInput.inputValue()).toBe('updated');
    expect(
      await host.evaluate(
        (element, family) =>
          element.shadowRoot?.querySelectorAll(`#jsonforms-svelte-${family}-base-style`).length,
        family,
      ),
    ).toBe(1);
    await host.evaluate((element) => {
      const form = element as HTMLElement & {
        observedChanges?: unknown[];
        bubbledEvents?: Array<{
          type: string;
          bubbles: boolean;
          composed: boolean;
          data?: unknown;
        }>;
      };
      form.observedChanges = [];
      form.bubbledEvents = [];
      for (const type of ['change', 'handle-action']) {
        document.addEventListener(type, (event) => {
          if (event.target !== form || !(event instanceof CustomEvent)) return;
          form.bubbledEvents?.push({
            type,
            bubbles: event.bubbles,
            composed: event.composed,
            data: type === 'change' ? event.detail?.data : undefined,
          });
        });
      }
    });
    await bulgarianInput.fill('reconnected');
    await page.waitForFunction(() => {
      const host = document.querySelector('#host-lifecycle-test') as
        | (HTMLElement & { observedChanges?: Array<{ data?: unknown }> })
        | null;
      return host?.observedChanges?.some((change) => change.data === 'reconnected');
    });
    const changes = await host.evaluate(
      (element) => (element as HTMLElement & { observedChanges?: unknown[] }).observedChanges,
    );
    expect(changes).toHaveLength(1);
    expect(
      await host.evaluate(
        (element) => (element as HTMLElement & { bubbledEvents?: unknown[] }).bubbledEvents,
      ),
    ).toEqual([{ type: 'change', bubbles: true, composed: true, data: 'reconnected' }]);

    await host.evaluate((element) => {
      const form = element as HTMLElement & {
        observedActions?: Array<{ action: string; name?: unknown }>;
        observedContexts?: unknown[];
        callbackContextMatches?: boolean[];
      };
      form.observedActions = [];
      form.observedContexts = [];
      form.callbackContextMatches = [];
      form.addEventListener('handle-action', (event) => {
        const detail = (
          event as CustomEvent<{
            action: string;
            params: { name?: unknown };
            context: { data: unknown };
            callback?: (source: { context: { data: unknown }; params: { name?: unknown } }) => void;
          }>
        ).detail;
        form.observedActions?.push({ action: detail.action, name: detail.params.name });
        form.observedContexts?.push(detail.context);
        detail.callback = (source) => {
          form.callbackContextMatches?.push(source.context === detail.context);
          source.context.data = { name: source.params.name };
        };
      });
      form.setAttribute(
        'schema',
        JSON.stringify({ type: 'object', properties: { name: { type: 'string' } } }),
      );
      form.setAttribute(
        'uischema',
        JSON.stringify({
          type: 'VerticalLayout',
          elements: [
            { type: 'Control', scope: '#/properties/name' },
            { type: 'Button', label: 'Reset name', action: 'reset', params: { name: 'after' } },
          ],
        }),
      );
      form.setAttribute('data', JSON.stringify({ name: 'before' }));
    });
    await host.getByRole('button', { name: 'Reset name' }).click();
    await page.waitForFunction(() => {
      const host = document.querySelector('#host-lifecycle-test');
      return host?.shadowRoot?.querySelector('input')?.value === 'after';
    });
    expect(
      await host.evaluate(
        (element) =>
          (element as HTMLElement & { observedActions?: Array<{ action: string; name: unknown }> })
            .observedActions,
      ),
    ).toEqual([{ action: 'reset', name: 'after' }]);
    await host.getByRole('button', { name: 'Reset name' }).click();
    expect(
      await host.evaluate((element) => {
        const form = element as HTMLElement & {
          observedContexts?: unknown[];
          callbackContextMatches?: boolean[];
        };
        return {
          stable: form.observedContexts?.[0] === form.observedContexts?.[1],
          callbacks: form.callbackContextMatches,
        };
      }),
    ).toEqual({ stable: true, callbacks: [true, true] });
    expect(
      await host.evaluate((element) =>
        (
          element as HTMLElement & { bubbledEvents?: Array<{ type: string }> }
        ).bubbledEvents?.filter((event) => event.type === 'handle-action'),
      ),
    ).toEqual([
      { type: 'handle-action', bubbles: true, composed: true, data: undefined },
      { type: 'handle-action', bubbles: true, composed: true, data: undefined },
    ]);

    await host.evaluate((element) => {
      element.setAttribute('schema', JSON.stringify({ type: 'string', maxLength: 4 }));
      element.setAttribute('uischema', JSON.stringify({ type: 'Control', scope: '#' }));
      element.setAttribute('data', JSON.stringify('ab'));
      element.setAttribute('config', JSON.stringify({ restrict: false }));
    });
    const limitedInput = host.getByRole('textbox');
    await limitedInput.fill('abcdef');
    expect(await limitedInput.inputValue()).toBe('abcdef');
    await limitedInput.fill('ab');
    expect(await limitedInput.inputValue()).toBe('ab');
    await host.evaluate((element) =>
      element.setAttribute('config', JSON.stringify({ restrict: true })),
    );
    await limitedInput.fill('ghijkl');
    expect(await limitedInput.inputValue()).toBe('ghij');
    await host.evaluate((element) => {
      (element as HTMLElement & { config: { restrict: boolean } }).config = { restrict: false };
    });
    await limitedInput.fill('mnopqr');
    expect(await limitedInput.inputValue()).toBe('mnopqr');
    expect(errors).toEqual([]);
  },
  { families, locales: ['en'], hosts: ['webcomponent'], timeout: 30_000 },
);
