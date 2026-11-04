import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
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

it('keeps an off-page dynamic-property schema error reachable without showing that entry', async () => {
  const example = createSpecPropertyPaginationExample(() => 'en');
  const data = structuredClone(propertyData);
  data.references['guest-12'] = 'X';
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          bookingReference: { type: 'string' },
          references: { type: 'object', additionalProperties: { type: 'string', minLength: 3 } },
        },
      },
      uischema: example.uischema as UISchemaElement,
      data,
      config: example.config,
      i18n: example.i18n,
      renderers: skeletonRenderers,
      cells: skeletonCells,
    },
  });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-additional-properties]')).not.toBeNull(),
  );
  expect(page.getByRole('textbox', { name: 'guest-12', exact: true }).query()).toBeNull();
  const errorPage = messages.en['collection.errorPage']
    .replace('{page}', '3')
    .replace('{count}', '1');
  await page.getByRole('button', { name: errorPage, exact: true }).click();
  await expect
    .element(page.getByRole('textbox', { name: 'guest-12', exact: true }))
    .toHaveValue('X');
});

it('keeps off-page schema errors in the collection summary and navigates to them', async () => {
  const data = Array.from({ length: 6 }, (_, index) => ({
    name: index === 5 ? 'X' : `Applicant ${index + 1}`,
  }));
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string', minLength: 3 } },
        },
      },
      uischema: { type: 'Control', scope: '#', options: { table: true } },
      data,
      renderers: skeletonRenderers,
      cells: skeletonCells,
    },
  });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-array-summary]')).not.toBeNull(),
  );
  expect(view.container.querySelector('tbody [data-array-row-index="5"]')).toBeNull();
  const errorPage = messages.en['collection.errorPage']
    .replace('{page}', '2')
    .replace('{count}', '1');
  await page.getByRole('button', { name: errorPage, exact: true }).click();
  await vi.waitFor(() =>
    expect(view.container.querySelector('tbody [data-array-row-index="5"]')).not.toBeNull(),
  );
  expect(data[5].name).toBe('X');
});

it('does not redirect a composing dynamic-property draft after external replacement', async () => {
  const example = createSpecPropertyPaginationExample(() => 'en');
  const data = structuredClone(propertyData);
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: example.schema as JsonSchema,
      uischema: example.uischema as UISchemaElement,
      data,
      config: example.config,
      i18n: example.i18n,
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const original = page.getByRole('textbox', { name: 'guest-01', exact: true });
  await expect.element(original).toHaveValue('REF-100');
  const oldEditor = original.element() as HTMLInputElement;
  oldEditor.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  oldEditor.value = 'Uncommitted draft';
  oldEditor.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  expect(onchange.mock.lastCall?.[0].data).toEqual(data);

  const replacement = structuredClone(data);
  Reflect.deleteProperty(replacement.references, 'guest-01');
  await view.rerender({ data: replacement });
  await expect
    .element(page.getByRole('textbox', { name: 'guest-02', exact: true }))
    .toHaveValue('REF-101');
  oldEditor.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  await page.getByRole('button', { name: messages.en['collection.next'], exact: true }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(replacement));
  expect(replacement.references['guest-02']).toBe('REF-101');
});

it('does not commit a composing row draft into a different item after external replacement', async () => {
  const data = Array.from({ length: 7 }, (_, index) => ({ name: `Person ${index + 1}` }));
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      uischema: { type: 'Control', scope: '#', options: { table: true } },
      data,
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const editor = () =>
    view.container.querySelector<HTMLInputElement>(
      'tbody [data-array-row-index="0"] input[type="text"]',
    );
  await vi.waitFor(() => expect(editor()?.value).toBe('Person 1'));
  const oldEditor = editor()!;
  oldEditor.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  oldEditor.value = 'Uncommitted draft';
  oldEditor.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  expect(onchange.mock.lastCall?.[0].data).toEqual(data);

  const replacement = data.slice(1);
  await view.rerender({ data: replacement });
  await vi.waitFor(() => expect(editor()?.value).toBe('Person 2'));
  oldEditor.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  await page.getByRole('button', { name: messages.en['collection.next'], exact: true }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(replacement));
  expect(replacement[0].name).toBe('Person 2');
});

it('keeps the first visible source row on screen when the page size changes', async () => {
  const data = Array.from({ length: 12 }, (_, index) => ({ name: `Person ${index + 1}` }));
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: { table: true, pagination: { pageSize: 5, pageSizeOptions: [3, 5, 10] } },
      },
      data,
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  await vi.waitFor(() => expect(view.container.querySelectorAll('tbody tr')).toHaveLength(5));
  await page.getByRole('button', { name: messages.en['collection.next'], exact: true }).click();
  await vi.waitFor(() =>
    expect(
      [...view.container.querySelectorAll<HTMLElement>('tbody [data-array-row-index]')].map((row) =>
        Number(row.dataset.arrayRowIndex),
      ),
    ).toEqual([5, 6, 7, 8, 9]),
  );
  const initialChangeCount = onchange.mock.calls.length;
  const size = view.container.querySelector<HTMLSelectElement>(
    `select[aria-label="${messages.en['collection.pageSize']}"]`,
  )!;
  size.value = '3';
  size.dispatchEvent(new Event('change', { bubbles: true }));
  await vi.waitFor(() =>
    expect(
      [...view.container.querySelectorAll<HTMLElement>('tbody [data-array-row-index]')].map((row) =>
        Number(row.dataset.arrayRowIndex),
      ),
    ).toEqual([3, 4, 5]),
  );
  expect(onchange.mock.calls).toHaveLength(initialChangeCount);
  expect(data).toHaveLength(12);
});

it('clamps to the preceding page after deleting its final row without shifting source data', async () => {
  const data = Array.from({ length: 6 }, (_, index) => ({ name: `Person ${index + 1}` }));
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: { type: 'object', properties: { name: { type: 'string' } } },
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: { table: true, confirmation: { delete: 'never' } },
      },
      data,
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  await vi.waitFor(() => expect(view.container.querySelectorAll('tbody tr')).toHaveLength(5));
  await page.getByRole('button', { name: messages.en['collection.next'], exact: true }).click();
  await vi.waitFor(() =>
    expect(view.container.querySelectorAll('tbody [data-array-row-index="5"]')).toHaveLength(1),
  );
  const lastRow = view.container.querySelector<HTMLElement>('tbody [data-array-row-index="5"]')!;
  lastRow.querySelector<HTMLInputElement>('[data-row-selection] input[type="checkbox"]')!.click();
  const deleteSelected = view.container.querySelector<HTMLButtonElement>('[data-delete-selected]')!;
  await vi.waitFor(() => expect(deleteSelected.disabled).toBe(false));
  deleteSelected.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data.slice(0, 5)));
  await vi.waitFor(() => expect(view.container.querySelectorAll('tbody tr')).toHaveLength(5));
  expect(view.container.querySelector('tbody [data-array-row-index="5"]')).toBeNull();
  expect(view.container.querySelector('[data-collection-footer]')).toBeNull();
  expect(data).toHaveLength(6);
});

it.each(['en', 'bg'] as const)(
  'edits original table rows across pages and flushes queued edits in %s',
  async (locale) => {
    const example = createSpecCollectionPaginationExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
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
    const footer = view.container.querySelector<HTMLElement>('[data-collection-footer]')!;
    expect(footer.parentElement?.querySelector('table')).not.toBeNull();
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
    const view = await render(JsonForms, {
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
    expect(
      view.container.querySelector('[data-additional-properties] [data-collection-footer]'),
    ).not.toBeNull();
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
  const view = await render(JsonForms, {
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
  const view = await render(JsonForms, {
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
