import { createCatalogTranslator } from '@chobantonov/jsonforms-svelte';
import { entry as labelEntry } from '../../src/lib/additional/LabelRenderer.entry';
import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { page } from 'vite-plus/test/browser';
import { mountControl, waitForChange } from '../testUtils';
import { entry as arrayEntry } from '../../src/lib/complex/ArrayControlRenderer.entry';
import { entry as compositeEntry } from '../../src/lib/cells/CompositeCell.entry';
import { shadcnCells } from '../../src/lib/cells';
import { shadcnRenderers } from '../../src/lib/renderers';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);
it('selects composite cells for mixed and Label-summary columns beside an ordinary text cell', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry, labelEntry],
    cells: shadcnCells,
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          mixed: { type: ['string', 'object'], title: 'Mixed' },
          plain: { type: 'string', title: 'Plain' },
          labelled: { type: 'number', title: 'Labelled' },
        },
      },
    },
    value: [{ mixed: { note: 'Kept' }, plain: 'hello', labelled: 7 }],
    options: {
      table: true,
      cells: { labelled: { summary: { type: 'Label', text: 'Scalar summary' } } },
    },
  });
  await vi.waitFor(() =>
    expect(view.container.querySelectorAll('[data-composite-cell]')).toHaveLength(2),
  );
  view.container.style.padding = '40px';
  const cell = view.container.querySelector<HTMLElement>('[data-composite-cell]')!;
  const actions = cell.querySelector<HTMLElement>('.composite-actions')!;
  await page.elementLocator(view.container).hover({ position: { x: 1, y: 1 } });
  expect(getComputedStyle(actions).opacity).toBe('0');
  await page.elementLocator(cell).hover();
  expect(getComputedStyle(actions).opacity).toBe('1');
  await page.elementLocator(view.container).hover({ position: { x: 1, y: 1 } });
  cell.querySelector<HTMLButtonElement>('button')!.focus();
  expect(getComputedStyle(actions).opacity).toBe('1');
  expect(
    [...view.container.querySelectorAll<HTMLInputElement>('input')].some(
      (input) => input.value === 'hello',
    ),
  ).toBe(true);
  expect(view.container.querySelectorAll('[data-composite-summary]')[1]?.textContent).toContain(
    'Scalar summary',
  );
});
it.each([
  { local: {}, expected: 'details' },
  {
    local: { summary: { type: 'Control', scope: '#/properties/street' } },
    expected: 'Main Street',
  },
])(
  'ignores removed nested cells and uses the selected column descriptor',
  async ({ local, expected }) => {
    const { view } = await mountControl({
      renderers: [arrayEntry],
      cells: [compositeEntry],
      propertySchema: {
        type: 'array',
        items: {
          type: 'object',
          properties: { address: { type: 'object', properties: { street: { type: 'string' } } } },
        },
      },
      value: [{ address: { street: 'Main Street' } }],
      config: {
        jsonformsExtended: { cells: { address: { summary: { type: 'Label', text: 'Legacy' } } } },
      },
      options: { table: true, cells: { address: local } },
    });
    const summary = view.container.querySelector('[data-composite-summary]');
    expect(summary?.textContent).toContain(expected);
    expect(summary?.textContent).not.toContain('Legacy');
  },
);
it('previews a literal dotted Control summary without reading its nested lookalike', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          contact: {
            type: 'object',
            properties: {
              'a.b': { type: 'string' },
              a: { type: 'object', properties: { b: { type: 'string' } } },
            },
          },
        },
      },
    },
    value: [{ contact: { 'a.b': 'literal', a: { b: 'nested' } } }],
    options: {
      table: true,
      cells: { contact: { summary: { type: 'Control', scope: '#/properties/a.b' } } },
    },
  });
  const summary = view.container.querySelector('[data-composite-summary]');
  expect(summary?.textContent).toContain('literal');
  expect(summary?.textContent).not.toContain('nested');
});

it('opens an absent constructor-named composite cell without reading the inherited constructor', async () => {
  const { view, onchange } = await mountControl({
    renderers: shadcnRenderers,
    cells: shadcnCells,
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          constructor: {
            type: 'object',
            properties: { name: { type: 'string', title: 'Name' } },
          },
        },
      },
    },
    value: [{}],
    options: { table: true },
  });
  const cell = view.container.querySelector<HTMLElement>('[data-composite-cell]')!;
  expect(cell).toBeTruthy();
  cell.querySelector<HTMLButtonElement>('button')!.click();
  const name = page.getByRole('dialog').getByRole('textbox', { name: 'Name', exact: true });
  await name.fill('Added');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: messages.en['composite.apply'] })
    .click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data.value).toEqual([{ constructor: { name: 'Added' } }]),
  );
});

it('uses a selected-cell summary without a form-wide summary fallback', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'object', properties: { street: { type: 'string' } } },
        },
      },
    },
    value: [{ address: { street: 'Main Street' } }],
    config: { summary: { type: 'Control', scope: '#/properties/street' } },
    options: { table: true, cells: { address: {} } },
  });
  const summary = view.container.querySelector('[data-composite-summary]');
  expect(summary?.textContent).not.toContain('Main Street');
  expect(summary?.textContent).toContain('details');
});
it.each([
  { name: 'flat labels', cell: {}, expected: ['Apply', 'Cancel'] },
  {
    name: 'selected-cell labels',
    cell: { okLabel: 'Save address', cancelLabel: 'Discard address' },
    expected: ['Save address', 'Discard address'],
  },
])('keeps $name scoped to the composite dialog', async ({ cell, expected }) => {
  await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'object', title: 'Address', properties: { street: { type: 'string' } } },
        },
      },
    },
    value: [{ address: { street: 'Main Street' } }],
    config: { okLabel: 'Global save', cancelLabel: 'Global discard' },
    options: { table: true, cells: { address: cell } },
  });
  await page.getByRole('button', { name: 'Edit Address', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect
    .element(dialog.getByRole('button', { name: expected[0], exact: true }))
    .toBeVisible();
  await expect
    .element(dialog.getByRole('button', { name: expected[1], exact: true }))
    .toBeVisible();
});
it.each([
  {
    name: 'flat showEmptyButton',
    config: { showEmptyButton: true },
    cell: {},
    clear: false,
  },
  {
    name: 'removed showEmptyButton',
    config: { jsonformsExtended: { showEmptyButton: true } },
    cell: {},
    clear: false,
  },
  {
    name: 'flat emptyLabel',
    config: { emptyLabel: 'Global clear' },
    cell: { showEmptyButton: true },
    clear: true,
  },
  {
    name: 'selected-cell Clear and label',
    config: { showEmptyButton: false, emptyLabel: 'Global clear' },
    cell: { showEmptyButton: true, emptyLabel: 'Clear selected cell' },
    clear: true,
  },
  {
    name: 'selected-cell false',
    config: { showEmptyButton: true },
    cell: { showEmptyButton: false },
    clear: false,
  },
  {
    name: 'removed emptyLabel',
    config: { jsonformsExtended: { emptyLabel: 'Legacy clear' } },
    cell: { showEmptyButton: true },
    clear: true,
  },
])('keeps $name outside local composite actions', async ({ config, cell, clear }) => {
  await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: { phones: { type: 'array', title: 'Phones', items: { type: 'string' } } },
      },
    },
    value: [{ phones: ['123'] }],
    config,
    options: { table: true, cells: { phones: cell } },
  });
  await page.getByRole('button', { name: 'Edit Phones', exact: true }).click();
  const action = page.getByRole('dialog').getByRole('button', { name: 'Clear', exact: true });
  if (clear && !('emptyLabel' in cell)) await expect.element(action).toBeVisible();
  else expect(action.query()).toBeNull();
  if ('emptyLabel' in cell) {
    await expect
      .element(page.getByRole('dialog').getByRole('button', { name: cell.emptyLabel, exact: true }))
      .toBeVisible();
    expect(action.query()).toBeNull();
  }
  expect(page.getByRole('button', { name: 'Global clear', exact: true }).query()).toBeNull();
  expect(page.getByRole('button', { name: 'Legacy clear', exact: true }).query()).toBeNull();
});
it('resolves object summaries and previews primitive array items', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'object', properties: { street: { type: 'string' } } },
          phones: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    value: [{ address: { street: 'Main Street' }, phones: ['555-0100', '555-0200', '555-0300'] }],
    options: {
      table: true,
      cells: {
        address: { summary: { type: 'Control', scope: '#/properties/street' } },
        phones: { summary: { type: 'Control', scope: '#' } },
      },
    },
  });
  await tick();
  expect(view.container.textContent).toContain('Main Street');
  expect(view.container.textContent).toContain('555-0100, 555-0200 (+1 more)');
  expect(view.container.textContent).not.toContain('555-0300');
});
it('distinguishes empty from absent arrays', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          phones: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    value: [{ phones: [] }, {}],
    options: { table: true },
  });
  await tick();
  expect(view.container.textContent).toContain('0 items');
  expect(view.container.textContent).toContain('Not set');
});

it('resolves each object item and localizes the remaining count', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          people: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
      },
    },
    value: [{ people: [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Carol' }] }],
    options: {
      table: true,
      cells: { people: { summary: { type: 'Control', scope: '#/properties/name' } } },
    },
  });
  await view.rerender({
    i18n: {
      locale: 'en',
      translate: (key, fallback, context) =>
        key === 'composite.summary.more' ? '(' + context.count + ' remaining)' : (fallback ?? key),
    },
  });
  await tick();
  expect(view.container.textContent).toContain('Alice, Bob (1 remaining)');
});
it('uses counts without a descriptor or when no item summary resolves', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          phones: { type: 'array', items: { type: 'string' } },
          people: { type: 'array', items: { type: 'object' } },
        },
      },
    },
    value: [{ phones: ['a', 'b'], people: [{}] }],
    options: {
      table: true,
      cells: { people: { summary: { type: 'Control', scope: '#/properties/name' } } },
    },
  });
  await tick();
  expect(view.container.textContent).toContain('2 items');
  expect(view.container.textContent).toContain('1 item');
});

it('keeps the summary selectable and removes a composite value only through its clear action', async () => {
  const { view, onchange } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'object', title: 'Address', properties: { street: { type: 'string' } } },
        },
      },
    },
    value: [{ address: { street: 'Main Street' } }],
    options: {
      table: true,
      cells: { address: { summary: { type: 'Control', scope: '#/properties/street' } } },
    },
  });
  await tick();
  await page.getByText('Main Street', { exact: true }).click();
  expect(document.querySelector('[role="dialog"], dialog[open]')).toBeNull();
  const remove = view.container.querySelector<HTMLButtonElement>(
    'button[aria-label="Remove Address"]',
  );
  expect(remove).not.toBeNull();
  const previousCalls = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Remove Address', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes', exact: true }).click();
  const event = await waitForChange(onchange, previousCalls);
  expect(event.data.value).toEqual([{}]);
});

it('keeps the clear action disabled when removing the property would violate minProperties', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        minProperties: 1,
        properties: {
          address: { type: 'object', title: 'Address', properties: { street: { type: 'string' } } },
        },
      },
    },
    value: [{ address: { street: 'Main Street' } }],
    options: { table: true, restrict: true },
  });
  await view.rerender({ config: { restrict: true } });
  await tick();
  expect(
    view.container.querySelector<HTMLButtonElement>('button[aria-label="Remove Address"]')
      ?.disabled,
  ).toBe(true);
});

it('uses the literal dotted column owner for the composite removal limit', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        minProperties: 2,
        properties: {
          'a.b': { type: 'object', title: 'Literal', properties: { name: { type: 'string' } } },
          a: { type: 'object', properties: { b: { type: 'object' } } },
        },
      },
    },
    value: [{ 'a.b': { name: 'Keep' }, a: { b: {} } }],
    options: { table: true, restrict: true },
  });
  await view.rerender({ config: { restrict: true } });
  await tick();
  expect(
    view.container.querySelector<HTMLButtonElement>('button[aria-label="Remove Literal"]')
      ?.disabled,
  ).toBe(true);
});

it('empties array contents in the detail dialog while retaining the property', async () => {
  const { onchange } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          phones: { type: 'array', title: 'Phones', items: { type: 'string' } },
        },
      },
    },
    value: [{ phones: ['123'] }],
    options: { table: true, cells: { phones: { showEmptyButton: true } } },
  });
  await tick();
  await page.getByRole('button', { name: 'Edit Phones', exact: true }).click();
  const previousCalls = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: messages.en['confirm.delete.title'],
    exact: true,
  });
  await expect.element(confirmation).toBeVisible();
  expect(onchange.mock.calls.length).toBe(previousCalls);
  await expect.element(page.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled();
  await confirmation.getByRole('button', { name: messages.en['confirm.accept'] }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await waitForChange(onchange, previousCalls)).data.value).toEqual([{ phones: [] }]);
});

it('stages optional removal and discards it on Cancel', async () => {
  const { onchange } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          phones: { type: 'array', title: 'Phones', items: { type: 'string' } },
        },
      },
    },
    value: [{ phones: ['123'] }],
    options: {
      table: true,
      cells: { phones: { showRemoveButton: true, removeLabel: 'Unset phones' } },
    },
  });
  await tick();
  await page.getByRole('button', { name: 'Edit Phones', exact: true }).click();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Unset phones', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: messages.en['confirm.delete.title'],
    exact: true,
  });
  await expect.element(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: messages.en['confirm.decline'] }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(onchange.mock.calls.length).toBe(before);
  await page.getByRole('button', { name: 'Edit Phones', exact: true }).click();
  await page.getByRole('button', { name: 'Unset phones', exact: true }).click();
  await confirmation.getByRole('button', { name: messages.en['confirm.accept'] }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual([{}]);
});

it('applies a local never policy to draft Remove without writing until Apply', async () => {
  const { onchange } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          phones: { type: 'array', title: 'Phones', items: { type: 'string' } },
        },
      },
    },
    value: [{ phones: ['123'] }],
    config: { jsonformsExtended: { confirmation: { default: 'always' } } },
    options: {
      table: true,
      cells: {
        phones: { showRemoveButton: true, confirmation: { delete: 'never' } },
      },
    },
  });
  await tick();
  await page.getByRole('button', { name: 'Edit Phones', exact: true }).click();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  expect(
    page.getByRole('dialog', { name: messages.en['confirm.delete.title'], exact: true }).query(),
  ).toBeNull();
  expect(onchange.mock.calls.length).toBe(before);
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual([{}]);
});

it('cancels a pending draft Remove when the form becomes readonly', async () => {
  const { view, onchange } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          phones: { type: 'array', title: 'Phones', items: { type: 'string' } },
        },
      },
    },
    value: [{ phones: ['123'] }],
    options: { table: true, cells: { phones: { showRemoveButton: true } } },
  });
  await tick();
  await page.getByRole('button', { name: 'Edit Phones', exact: true }).click();
  await page.getByRole('button', { name: 'Remove', exact: true }).click();
  const confirmation = page.getByRole('dialog', {
    name: messages.en['confirm.delete.title'],
    exact: true,
  });
  await expect.element(confirmation).toBeVisible();
  await view.rerender({ readonly: true });
  await vi.waitFor(() => expect(confirmation.query()).toBeNull());
  await expect.element(page.getByRole('button', { name: 'Apply', exact: true })).toBeDisabled();
  expect(onchange.mock.lastCall?.[0].data.value).toEqual([{ phones: ['123'] }]);
});

it('distinguishes generated summaries from literal data and refreshes host translations', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: { city: { type: 'string' }, phone: { type: 'string' } },
          },
        },
      },
    },
    value: [
      { address: {} },
      { address: { phone: '123' } },
      { address: { city: 'City not specified' } },
    ],
    options: {
      table: true,
      cells: { address: { summary: { type: 'Control', scope: '#/properties/city' } } },
    },
  });
  await tick();
  const summaries = () => [...view.container.querySelectorAll('[data-composite-summary]')];
  expect(
    summaries().map((element) => [element.textContent, element.classList.contains('generated')]),
  ).toEqual([
    ['Empty object', true],
    ['City not specified', true],
    ['City not specified', false],
  ]);
  await view.rerender({
    i18n: {
      locale: 'fr',
      translate: (key, fallback) =>
        (
          {
            'composite.summary.emptyObject': 'Objet vide',
            'composite.summary.unspecified': '{label} non renseigné',
            'city.label': 'Ville',
          } as Record<string, string>
        )[key] ??
        fallback ??
        key,
    },
  });
  await tick();
  expect(summaries().map((element) => element.textContent)).toEqual([
    'Objet vide',
    'Ville non renseigné',
    'City not specified',
  ]);
});

it('keeps type indicators decorative and honors explicit cell overrides', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          address: { type: 'object' },
          phones: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    value: [{ address: {}, phones: [] }],
    options: { table: true, cells: { address: { showTypeIndicator: false } } },
  });
  await tick();
  expect(view.container.querySelectorAll('[data-composite-type]')).toHaveLength(0);
  await view.rerender({ config: { showTypeIndicator: true } });
  await tick();
  const markers = view.container.querySelectorAll('[data-composite-type]');
  expect(markers).toHaveLength(1);
  expect(markers[0].textContent).toBe('[]');
  expect(markers[0].getAttribute('aria-hidden')).toBe('true');
  expect(view.container.textContent).toContain('Empty object');
  expect(view.container.textContent).toContain('0 items');
});

it('keeps Label preview errors scoped to detail controls and forbids whole-row clearing', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry, labelEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
    value: [{ name: 'Alice', notes: 42 }],
    options: {
      table: true,
      columnDefs: [
        { field: 'preview', scope: '#' },
        { field: 'namePreview', scope: '#' },
        { field: 'notesPreview', scope: '#' },
      ],
      cells: {
        preview: { summary: { type: 'Label', text: 'Preview only' }, showTypeIndicator: true },
        namePreview: {
          summary: { type: 'Label', text: 'Name preview' },
          detail: { type: 'Control', scope: '#/properties/name' },
          showTypeIndicator: true,
        },
        notesPreview: {
          summary: { type: 'Label', text: 'Notes preview' },
          detail: { type: 'Control', scope: '#/properties/notes' },
        },
      },
    },
  });
  await tick();
  const cells = [...view.container.querySelectorAll('tbody tr:first-child td')];
  const preview = cells.find((cell) => cell.textContent?.includes('Preview only'))!;
  const namePreview = cells.find((cell) => cell.textContent?.includes('Name preview'))!;
  const notesPreview = cells.find((cell) => cell.textContent?.includes('Notes preview'))!;
  expect(preview.querySelector('.cell-invalid')).toBeNull();
  expect(preview.querySelector('button')).toBeNull();
  expect(namePreview.querySelector('.cell-invalid')).toBeNull();
  expect(notesPreview.querySelector('.cell-invalid')).not.toBeNull();
  const markers = view.container.querySelectorAll('[data-composite-type]');
  expect(markers).toHaveLength(2);
  expect(Array.from(markers).every((marker) => marker.getAttribute('aria-hidden') === 'true')).toBe(
    true,
  );
  expect(preview.textContent).toContain('Preview only');
  expect(namePreview.textContent).toContain('Name preview');
  expect(view.container.querySelector('.composite-clear')).toBeNull();
});

it('keeps a literal dotted Label preview error out of the nested lookalike cell', async () => {
  const { view } = await mountControl({
    renderers: [arrayEntry, labelEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          'a.b': { type: 'string' },
          a: { type: 'object', properties: { b: { type: 'string' } } },
        },
      },
    },
    value: [{ 'a.b': 42, a: { b: 'Good' } }],
    options: {
      table: true,
      columnDefs: [
        { field: 'literalPreview', scope: '#' },
        { field: 'nestedPreview', scope: '#' },
      ],
      cells: {
        literalPreview: {
          summary: { type: 'Label', text: 'Literal preview' },
          detail: { type: 'Control', scope: '#/properties/a.b' },
        },
        nestedPreview: {
          summary: { type: 'Label', text: 'Nested preview' },
          detail: { type: 'Control', scope: '#/properties/a/properties/b' },
        },
      },
    },
  });
  await tick();
  const cells = [...view.container.querySelectorAll('tbody tr:first-child td')];
  const literal = cells.find((cell) => cell.textContent?.includes('Literal preview'))!;
  const nested = cells.find((cell) => cell.textContent?.includes('Nested preview'))!;
  expect(literal.querySelector('.cell-invalid')).not.toBeNull();
  expect(nested.querySelector('.cell-invalid')).toBeNull();
  await view.rerender({
    validationMode: 'NoValidation',
    additionalErrors: [
      {
        instancePath: '/value/0/a.b',
        keyword: 'server',
        schemaPath: '',
        params: {},
        message: 'Host literal error',
      },
    ],
  });
  await tick();
  const feedback = literal.querySelector<HTMLElement>('[aria-label*="Host literal error"]');
  expect(feedback).not.toBeNull();
  expect(feedback?.getAttribute('aria-label')).not.toContain('must be string');
  expect(nested.querySelector('.cell-invalid')).toBeNull();
});

it('uses portable composite array and dialog labels', async () => {
  const translate = createCatalogTranslator('en', {
    en: {
      'composite.itemsLabel': 'entries',
      'composite.detailsTitle': 'Record details',
    },
  });
  const { view } = await mountControl({
    renderers: [arrayEntry],
    cells: [compositeEntry],
    propertySchema: {
      type: 'array',
      items: {
        type: 'object',
        properties: { list: { type: 'array', items: { type: 'string' } } },
      },
    },
    value: [{ list: ['one'] }],
    options: { table: true },
    i18n: { locale: 'en', translate },
  });
  let edit: HTMLButtonElement;
  await vi.waitFor(() => {
    edit = view.container.querySelector<HTMLButtonElement>('[data-composite-cell] button')!;
    expect(edit?.getAttribute('aria-label')).toBe('Edit entries');
  });
  edit!.click();
  await expect.element(page.getByRole('dialog', { name: 'Record details' })).toBeVisible();
});
