import { entry as labelEntry } from '../../src/lib/additional/LabelRenderer.entry';
import '../test.css';
import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { page } from 'vitest/browser';
import { mountControl, waitForChange } from '../testUtils';
import { entry as arrayEntry } from '../../src/lib/complex/ArrayControlRenderer.entry';
import { entry as compositeEntry } from '../../src/lib/cells/CompositeCell.entry';
afterEach(cleanup);
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
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(onchange.mock.calls.length).toBe(before);
  await page.getByRole('button', { name: 'Edit Phones', exact: true }).click();
  await page.getByRole('button', { name: 'Unset phones', exact: true }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual([{}]);
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
          ({
            'composite.summary.emptyObject': 'Objet vide',
            'composite.summary.unspecified': '{label} non renseigné',
            'city.label': 'Ville',
          }) as Record<string, string>
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
  const cells = view.container.querySelectorAll('tbody tr:first-child td');
  expect(cells[0].querySelector('.cell-invalid')).toBeNull();
  expect(cells[0].querySelector('button')).toBeNull();
  expect(cells[1].querySelector('.cell-invalid')).toBeNull();
  expect(cells[2].querySelector('.cell-invalid')).not.toBeNull();
  expect(view.container.querySelector('[data-composite-type]')).toBeNull();
  expect(view.container.querySelector('.composite-clear')).toBeNull();
});
