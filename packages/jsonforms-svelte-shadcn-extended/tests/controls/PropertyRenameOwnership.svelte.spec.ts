import { JsonForms, type JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte';
import { shadcnRenderers, shadcnCells } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedRenderers, shadcnExtendedCells } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
const cases = (['en', 'bg'] as const).flatMap((locale) =>
  [
    ['old', 'new'],
    ['old', 'new.name'],
    ['old.name', ''],
    ['', 'new'],
  ].map(([before, after]) => ({ locale, before, after })),
);
it.each(cases)(
  'retains the editor, errors and focus when renaming $before to $after in $locale',
  async ({ locale, before, after }) => {
    const validity = vi.fn<(event: JsonFormsValidityEvent) => void>();
    const changes = vi.fn();
    const host = {
      instancePath: '/bag/' + before,
      keyword: 'server',
      schemaPath: '',
      params: {},
      message: 'Keep original host path',
    };
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            bag: { type: 'object', additionalProperties: { type: 'string', format: 'byte' } },
          },
        },
        uischema: { type: 'Control', scope: '#/properties/bag' },
        data: { bag: { [before]: '' }, sibling: 'keep' },
        config: { formatMaximum: 2, restrict: false, allowEmptyPropertyNames: true },
        i18n: { locale },
        renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
        cells: [...shadcnExtendedCells, ...shadcnCells],
        additionalErrors: [host],
        onvaliditychange: validity,
        onchange: changes,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>(
      '[data-file-control] input[type="file"]',
    )!;
    const transfer = new DataTransfer();
    transfer.items.add(new File(['hello'], 'large.txt'));
    input.files = transfer.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    await vi.waitFor(() =>
      expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
        host,
        expect.objectContaining({ keyword: 'fileSize', instancePath: '/bag/' + before }),
      ]),
    );
    const rename = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(
      (node) =>
        node.getAttribute('aria-label') ===
        messages[locale]['additionalProperties.renameNamed'].replace('{name}', before),
    )!;
    rename.focus();
    rename.click();
    await vi.waitFor(() =>
      expect(
        document.querySelector<HTMLElement>('[id$="-rename-property"]')?.checkVisibility(),
      ).toBe(true),
    );
    const field = document.querySelector<HTMLInputElement>('[id$="-rename-property"]')!;
    field.value = after;
    field.dispatchEvent(new InputEvent('input', { bubbles: true }));
    const publication = validity.mock.calls.length;
    field.closest('form')!.requestSubmit();
    await vi.waitFor(() =>
      expect(changes.mock.lastCall?.[0].data).toEqual({
        bag: { [after]: 'aGVsbG8=' },
        sibling: 'keep',
      }),
    );
    expect(view.container.querySelector('[data-file-control] input[type="file"]')).toBe(input);
    await vi.waitFor(() =>
      expect(validity.mock.lastCall?.[0].additionalErrors).toEqual([
        host,
        expect.objectContaining({ keyword: 'fileSize', instancePath: '/bag/' + after }),
      ]),
    );
    expect(
      validity.mock.calls
        .slice(publication)
        .every(([event]) => event.additionalErrors.some((error) => error.keyword === 'fileSize')),
    ).toBe(true);
    await vi.waitFor(() => expect(document.activeElement).toBe(rename));
  },
);
