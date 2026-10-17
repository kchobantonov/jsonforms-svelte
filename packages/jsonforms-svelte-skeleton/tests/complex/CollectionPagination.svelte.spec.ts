import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { skeletonRenderers } from '../../src/lib/renderers';
import { skeletonCells } from '../../src/lib/cells';
import { createSpecCollectionPaginationExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-collection-pagination';
import { createSpecPropertyPaginationExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-property-pagination';
import arrayData from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-collection-pagination/data.json';
import propertyData from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-property-pagination/data.json';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);

it.each(['en', 'bg'] as const)(
  'edits original table rows across pages and flushes queued edits in %s',
  async (locale) => {
    const example = createSpecCollectionPaginationExample(() => locale);
    const onchange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(arrayData),
        config: example.config,
        i18n: example.i18n,
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    await vi.waitFor(() => expect(view.container.querySelectorAll('tbody tr')).toHaveLength(5));
    await page
      .getByRole('button', { name: messages[locale]['collection.next'], exact: true })
      .click();
    const first = page.getByRole('textbox').first();
    await expect.element(first).toHaveValue('Applicant 06');
    await first.fill('Edited applicant');
    await page
      .getByRole('button', { name: messages[locale]['collection.next'], exact: true })
      .click();
    const expected = structuredClone(arrayData);
    expected.applicants[5].name = 'Edited applicant';
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    await page
      .getByRole('button', { name: messages[locale]['collection.previous'], exact: true })
      .click();
    await expect.element(first).toHaveValue('Edited applicant');
  },
);

it.each(['en', 'bg'] as const)(
  'pages dynamic properties while retaining declared fields in %s',
  async (locale) => {
    const example = createSpecPropertyPaginationExample(() => locale);
    const onchange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(propertyData),
        config: example.config,
        i18n: example.i18n,
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    await expect
      .element(page.getByRole('textbox', { name: 'guest-01', exact: true }))
      .toHaveValue('REF-100');
    await page
      .getByRole('button', { name: messages[locale]['collection.next'], exact: true })
      .click();
    const editor = page.getByRole('textbox', { name: 'guest-06', exact: true });
    await expect.element(editor).toHaveValue('REF-105');
    await editor.fill('Edited reference');
    await page
      .getByRole('button', { name: messages[locale]['collection.next'], exact: true })
      .click();
    const expected = structuredClone(propertyData);
    expected.references['guest-06'] = 'Edited reference';
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    expect(view.container.querySelector<HTMLInputElement>('input')?.value).toBe('CONF-2026-104');
    await view.rerender({ readonly: true });
    const before = onchange.mock.calls.length;
    await page
      .getByRole('button', { name: messages[locale]['collection.previous'], exact: true })
      .click();
    await expect.element(editor).toHaveValue('Edited reference');
    await expect.element(editor).toBeDisabled();
    expect(onchange.mock.calls.length).toBe(before);
  },
);

it('selects ordered columns and preserves resized widths across paging without changing data', async () => {
  const data = Array.from({ length: 6 }, (_, index) => ({
    name: `Person ${index}`,
    email: `p${index}@example.com`,
    hidden: 'keep',
  }));
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
            hidden: { type: 'string' },
          },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          columnDefs: [
            { field: 'email', width: 190, minWidth: 100, maxWidth: 400 },
            { field: 'name' },
            { field: 'email' },
            { field: 'unknown' },
          ],
        },
      },
      data,
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  await vi.waitFor(() =>
    expect(view.container.querySelectorAll('thead [data-column-field]')).toHaveLength(2),
  );
  expect(
    [...view.container.querySelectorAll<HTMLElement>('thead [data-column-field]')].map(
      (cell) => cell.dataset.columnField,
    ),
  ).toEqual(['email', 'name']);
  const handle = view.container.querySelector<HTMLElement>('[role="separator"]')!;
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  await vi.waitFor(() => expect(handle.getAttribute('aria-valuenow')).toBe('100'));
  const ltrWidth = Math.round(handle.closest('th')!.getBoundingClientRect().width + 10);
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await vi.waitFor(() => expect(handle.getAttribute('aria-valuenow')).toBe(String(ltrWidth)));
  view.container.dir = 'rtl';
  const rtlWidth = Math.round(handle.closest('th')!.getBoundingClientRect().width + 10);
  handle.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
  await vi.waitFor(() => expect(handle.getAttribute('aria-valuenow')).toBe(String(rtlWidth)));
  await page.getByRole('button', { name: messages.en['collection.next'], exact: true }).click();
  await expect.element(page.getByRole('textbox').first()).toHaveValue('p5@example.com');
  expect(handle.getAttribute('aria-valuenow')).toBe(String(rtlWidth));
  expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  await view.rerender({ uischema: { type: 'Control', scope: '#', options: { columnDefs: [] } } });
  await vi.waitFor(() =>
    expect(view.container.querySelectorAll('thead [data-column-field]')).toHaveLength(0),
  );
  expect(onchange.mock.lastCall?.[0].data).toEqual(data);
});

it('binds a whole-row presentation column to the original item and preserves hidden fields', async () => {
  const data = [{ name: 'Ada', hidden: 'keep' }];
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, hidden: { type: 'string' } },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          columnDefs: [{ field: 'summary', scope: '#' }],
          cells: {
            summary: {
              summary: { type: 'Control', scope: '#/properties/name' },
              detail: { type: 'Control', scope: '#/properties/name' },
            },
          },
        },
      },
      data,
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-composite-summary]')?.textContent).toBe('Ada'),
  );
  await page
    .getByRole('button', {
      name: messages.en['composite.edit'].replace('{label}', messages.en['composite.detailsLabel']),
      exact: true,
    })
    .click();
  await page.getByRole('textbox').fill('Grace');
  await page.getByRole('button', { name: messages.en['composite.apply'], exact: true }).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual([{ name: 'Grace', hidden: 'keep' }]),
  );
});
