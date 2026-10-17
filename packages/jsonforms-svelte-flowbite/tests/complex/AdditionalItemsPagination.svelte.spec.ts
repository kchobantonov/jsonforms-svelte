import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { flowbiteCells } from '../../src/lib/cells';
import { createSpecAdditionalItemsPaginationExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-additional-items-pagination';
import data from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-additional-items-pagination/data.json';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-additional-items-pagination/translations.json';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);

it.each(['en', 'bg'] as const)(
  'pages canonical tuple tails with absolute indices in %s',
  async (locale) => {
    const example = createSpecAdditionalItemsPaginationExample(() => locale);
    const onchange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(data),
        config: example.config,
        i18n: example.i18n,
        renderers: flowbiteRenderers,
        cells: flowbiteCells,
        onchange,
      },
    });
    const tail = () =>
      [...view.container.querySelectorAll<HTMLElement>('.additional-items')].find((element) =>
        element.checkVisibility(),
      )!;
    await vi.waitFor(() =>
      expect(tail().querySelectorAll('[data-additional-item]')).toHaveLength(5),
    );
    expect(view.container.querySelector<HTMLInputElement>('input')?.value).toBe('SHIP-104');
    await view.rerender({
      additionalErrors: [
        {
          keyword: 'server',
          instancePath: '/manifest/11',
          schemaPath: '',
          params: {},
          message: 'Check package',
        },
      ],
    });
    const errorPage = messages[locale]['collection.errorPage']
      .replace('{page}', '3')
      .replace('{count}', '1');
    await page.getByRole('button', { name: errorPage, exact: true }).click();
    expect(tail().querySelector('[data-additional-item="11"]')).not.toBeNull();
    await page
      .getByRole('button', { name: messages[locale]['collection.previous'], exact: true })
      .click();
    await page
      .getByRole('button', { name: messages[locale]['collection.previous'], exact: true })
      .click();
    await view.rerender({ additionalErrors: [] });
    const before = onchange.mock.calls.length;
    await page
      .getByRole('button', { name: messages[locale]['collection.next'], exact: true })
      .click();
    expect(onchange.mock.calls.length).toBe(before);
    expect(tail().querySelector('[data-additional-item="6"]')).not.toBeNull();
    const editor = page.getByRole('textbox', {
      name: messages[locale]['tuple.position'].replace('{position}', '7'),
      exact: true,
    });
    await editor.fill('Edited package 06');
    const expected = structuredClone(data);
    expected.manifest[6] = 'Edited package 06';
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    await page.getByRole('button', { name: messages[locale]['tuple.add'], exact: true }).click();
    await vi.waitFor(() =>
      expect(tail().querySelector('[data-additional-item="13"]')).not.toBeNull(),
    );
    expect(tail().querySelectorAll('[data-additional-item]')).toHaveLength(3);
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section2.label'],
        exact: true,
      })
      .click();
    await vi.waitFor(() =>
      expect(tail().querySelectorAll('[data-additional-item]')).toHaveLength(2),
    );
    expect(tail().querySelector('[data-collection-footer]')).toBeNull();
    expect(onchange.mock.lastCall?.[0].data.allPackages).toEqual(data.allPackages);
  },
);
