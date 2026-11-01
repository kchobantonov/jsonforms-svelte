import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'choice card referenced schema replacement',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=true`);
    await page.evaluate(
      async ({ family, locale }) => {
        const tag = `jsonforms-svelte-${family}`;
        await customElements.whenDefined(tag);
        const branch = (title: string, noteDefault?: string) => ({
          type: 'object',
          title,
          required: ['kind'],
          properties: {
            kind: { const: title, default: title },
            note: { type: 'string', default: noteDefault },
          },
        });
        const schema = (noteDefault: string) => ({
          type: 'object',
          properties: {
            plan: {
              oneOf: [{ $ref: '#/definitions/first' }, { $ref: '#/definitions/second' }],
            },
          },
          definitions: { first: branch('First'), second: branch('Second', noteDefault) },
        });
        const host = document.createElement(tag) as HTMLElement & {
          observedChanges?: { plan: { kind: string; note: string } }[];
        };
        host.id = 'referenced-card-host';
        host.style.cssText =
          'position:fixed;z-index:9999;top:70px;left:300px;width:700px;background:white;';
        host.observedChanges = [];
        host.addEventListener('change', (event) => {
          host.observedChanges?.push(
            (event as CustomEvent<{ data: { plan: { kind: string; note: string } } }>).detail.data,
          );
        });
        host.setAttribute('schema', JSON.stringify(schema('old default')));
        host.setAttribute(
          'uischema',
          JSON.stringify({
            type: 'Control',
            scope: '#/properties/plan',
            options: { format: 'cards', confirmation: { branchChange: 'always' } },
          }),
        );
        host.setAttribute('locale', locale);
        host.setAttribute('data', JSON.stringify({ plan: { kind: 'First', note: 'original' } }));
        document.body.append(host);
        (host as HTMLElement & { replacementSchema?: unknown }).replacementSchema =
          schema('new default');
      },
      { family, locale },
    );
    const host = page.locator('#referenced-card-host');
    const accept = page.getByRole('button', {
      name: messages[locale]['combinator.clearDialogAccept'],
      exact: true,
    });
    await host.getByText('Second', { exact: true }).click();
    await expect.poll(() => accept.count()).toBe(1);
    await host.evaluate((element) => {
      element.setAttribute(
        'schema',
        JSON.stringify((element as HTMLElement & { replacementSchema: unknown }).replacementSchema),
      );
    });
    await expect.poll(() => accept.count()).toBe(0);
    expect(
      await host.evaluate((element) =>
        (
          element as HTMLElement & {
            observedChanges?: { plan?: { kind?: string } }[];
          }
        ).observedChanges?.some((data) => data?.plan?.kind === 'Second'),
      ),
    ).toBe(false);
    await host.getByText('Second', { exact: true }).click();
    await expect.poll(() => accept.count()).toBe(1);
    await accept.click();
    await expect
      .poll(() =>
        host.evaluate(
          (element) =>
            (
              element as HTMLElement & { observedChanges?: { plan: { note: string } }[] }
            ).observedChanges?.at(-1)?.plan.note,
        ),
      )
      .toBe('new default');
    expect(pageErrors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 30000 },
);
