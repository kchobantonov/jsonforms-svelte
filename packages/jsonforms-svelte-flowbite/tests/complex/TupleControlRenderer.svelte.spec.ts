import '../test.css';
import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { page } from 'vitest/browser';
import Ajv2020 from 'ajv/dist/2020';
import { mountForm, mountControl, waitForChange } from '../testUtils';
import { flowbiteRenderers } from '../../src/lib/renderers';
afterEach(cleanup);
const schema = {
  type: 'array',
  items: [
    { type: 'string', title: 'Code' },
    { type: 'integer', title: 'Quantity' },
  ],
  additionalItems: false,
};
function setup(
  value: unknown = [],
  options: Record<string, unknown> = { restrict: true },
  propertySchema = schema,
) {
  return mountControl({
    propertySchema: propertySchema as any,
    renderers: flowbiteRenderers,
    value,
    options,
  });
}
async function edit(index: number, value: string, onchange: ReturnType<typeof setup>['onchange']) {
  const input = document.querySelectorAll<HTMLInputElement>('input')[index];
  const before = onchange.mock.calls.length;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return await waitForChange(onchange, before);
}
it('renders positional labels without populating missing values, then fills preceding defaults atomically', async () => {
  const { view, onchange } = setup();
  await tick();
  expect(view.container.textContent).toContain('Code');
  expect(view.container.textContent).toContain('Quantity');
  expect(onchange.mock.calls.every(([event]) => event.data.value.length === 0)).toBe(true);
  expect((await edit(1, '30', onchange)).data.value).toEqual(['', 30]);
});
it('preserves empty strings and does not shift following positions', async () => {
  const { onchange } = setup(['abc', 30]);
  await tick();
  expect((await edit(0, '', onchange)).data.value).toEqual(['', 30]);
});
it('holds numeric clearing as a draft rather than writing undefined or zero', async () => {
  const { onchange, view } = setup(['abc', 30]);
  await tick();
  const input = document.querySelectorAll<HTMLInputElement>('input')[1];
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(onchange.mock.calls.every(([event]) => event.data.value[1] === 30)).toBe(true);
  expect(view.container.textContent).toContain('Enter a value for this position.');
  expect((await edit(1, '40', onchange)).data.value).toEqual(['abc', 40]);
});
it('supports explicit uniform tuples and vertical orientation', async () => {
  const { view, onchange } = setup([], { variant: 'tuple', vertical: true }, {
    type: 'array',
    items: { type: 'number' },
    minItems: 2,
    maxItems: 2,
  } as any);
  await tick();
  expect(view.container.querySelector('.tuple-fields.vertical')).toBeTruthy();
  const fields = view.container.querySelectorAll('.tuple-fields.vertical > .tuple-field');
  expect(fields[0].getBoundingClientRect().height).toBeLessThan(140);
  expect(
    fields[1].getBoundingClientRect().top - fields[0].getBoundingClientRect().bottom,
  ).toBeLessThan(24);
  expect((await edit(1, '34', onchange)).data.value).toEqual([0, 34]);
});
it('shows a diagnostic for an unsupported uniform tuple', async () => {
  const { view } = setup([], { variant: 'tuple' }, {
    type: 'array',
    items: { type: 'number' },
  } as any);
  await tick();
  expect(view.container.textContent).toContain('Tuple presentation requires');
});
it('preserves excess values and offers corrective removal only for the tail', async () => {
  const { onchange, view } = setup(['abc', 30, 'extra']);
  await tick();
  expect(onchange.mock.calls.every(([event]) => event.data.value.length === 3)).toBe(true);
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Delete Item 3', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['abc', 30]);
  expect(view.container.textContent).not.toContain('Add item');
});
it('applies tail count restrictions and preserves the fixed prefix', async () => {
  const { onchange, view } = setup(['abc', 30], { restrict: true }, {
    ...schema,
    additionalItems: { type: 'string' },
    minItems: 2,
    maxItems: 3,
  } as any);
  await tick();
  const before = onchange.mock.calls.length;
  const addIcon = document.querySelector('button[aria-label="Add item"]');
  expect(addIcon?.querySelector('svg')).not.toBeNull();
  expect(addIcon?.getAttribute('title')).toBe('Add item');
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  const event = await waitForChange(onchange, before);
  expect(event.data.value).toEqual(['abc', 30, '']);
  await view.rerender({ data: event.data });
  await expect.element(page.getByRole('button', { name: 'Add item', exact: true })).toBeDisabled();
});
it('honors form readonly for fields and tail actions', async () => {
  const { view } = setup(['abc', 30], { restrict: true }, {
    ...schema,
    additionalItems: { type: 'string' },
  } as any);
  await view.rerender({ readonly: true });
  await tick();
  await expect.element(page.getByRole('button', { name: 'Add item', exact: true })).toBeDisabled();
  expect(
    [...document.querySelectorAll<HTMLInputElement>('input')].every(
      (input) => input.disabled || input.readOnly,
    ),
  ).toBe(true);
});
it('edits complex positions in a staged dialog without populating on open', async () => {
  const { onchange } = setup([], {}, {
    type: 'array',
    items: [
      {
        type: 'object',
        title: 'Address',
        properties: { street: { type: 'string', title: 'Street' } },
      },
    ],
    additionalItems: false,
  } as any);
  await tick();
  await page.getByRole('button', { name: /Edit Address/ }).click();
  expect(onchange.mock.calls.every(([event]) => event.data.value.length === 0)).toBe(true);
  const before = onchange.mock.calls.length;
  const input = document.querySelector<HTMLInputElement>('input')!;
  input.value = 'Main Street';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  expect(onchange.mock.calls.length).toBe(before);
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual([{ street: 'Main Street' }]);
});

it('uses positional translations and retains root reference resolution', async () => {
  const { view, onchange } = setup([], {}, {
    type: 'array',
    definitions: { coordinate: { type: 'number', title: 'X', i18n: 'coordinates.x' } },
    items: [{ $ref: '#/properties/value/definitions/coordinate' }, { type: 'number', title: 'Y' }],
    additionalItems: false,
  } as any);
  await view.rerender({
    i18n: {
      locale: 'en',
      translate: (key, fallback) =>
        key === 'coordinates.x.label' ? 'Horizontal coordinate' : (fallback ?? key),
    },
  });
  await tick();
  expect(view.container.textContent?.split('Horizontal coordinate').length).toBe(2);
  expect((await edit(1, '34', onchange)).data.value).toEqual([0, 34]);
});
it('retains a pending edit when an earlier position has no unambiguous default', async () => {
  const { view, onchange } = setup([], {}, {
    type: 'array',
    items: [{ enum: ['a', 'b'] }, { type: 'integer', title: 'Quantity' }],
    additionalItems: false,
  } as any);
  await tick();
  const input = document.querySelector<HTMLInputElement>('input[type="number"]')!;
  input.value = '30';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(onchange.mock.calls.every(([event]) => event.data.value.length === 0)).toBe(true);
  expect(view.container.textContent).toContain('Enter Item 1 first.');
  const before = onchange.mock.calls.length;
  await view.rerender({ data: { value: ['a'] } });
  await waitForChange(onchange, before);
  await expect.poll(() => onchange.mock.calls.at(-1)?.[0].data.value).toEqual(['a', 30]);
});
it('does not prevent tail growth when restrict is false', async () => {
  const { onchange } = setup(['abc', 30, 'one'], { restrict: false }, {
    ...schema,
    additionalItems: { type: 'string' },
    maxItems: 3,
  } as any);
  await tick();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['abc', 30, 'one', '']);
});

it('renders prefixItems with a draft-2020-12 validator', async () => {
  const { onchange } = mountForm({
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          prefixItems: [
            { type: 'number', title: 'X' },
            { type: 'number', title: 'Y' },
          ],
          items: false,
        },
      },
    } as any,
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: flowbiteRenderers,
    data: { value: [] },
    ajv: new Ajv2020({ strict: false, allErrors: true }),
  });
  await tick();
  expect((await edit(1, '34', onchange)).data.value).toEqual([0, 34]);
});

it('prevents removal below minItems and obeys disableAdd/disableRemove', async () => {
  const { view } = setup(['abc', 30, 'note'], { restrict: true }, {
    ...schema,
    additionalItems: { type: 'string' },
    minItems: 3,
  } as any);
  await tick();
  await expect
    .element(page.getByRole('button', { name: 'Delete Item 3', exact: true }))
    .toBeDisabled();
  await view.rerender({
    uischema: {
      type: 'Control',
      scope: '#/properties/value',
      options: { restrict: false, disableAdd: true, disableRemove: true },
    },
  });
  await expect
    .element(page.getByRole('button', { name: 'Delete Item 3', exact: true }))
    .toBeDisabled();
  await expect.element(page.getByRole('button', { name: 'Add item', exact: true })).toBeDisabled();
});

it('aligns the mixed additional-item selector and value below the positional label', async () => {
  await page.viewport(1000, 700);
  const { view } = setup(['name', 42], {}, {
    type: 'array',
    items: [{ type: 'string', title: 'Name' }],
    additionalItems: true,
  } as any);
  await tick();
  const row = view.container.querySelector('[data-additional-item="1"]')!;
  const selector = row.querySelector<HTMLElement>(
    '[id$="-input-selector"], [role="combobox"], select',
  )!;
  const input = row.querySelector<HTMLInputElement>('input')!;
  expect(row.querySelector('legend')?.textContent).toBe('Item 2');
  expect(selector).not.toBeNull();
  expect(input).not.toBeNull();
  expect(
    Math.abs(selector.getBoundingClientRect().top - input.getBoundingClientRect().top),
  ).toBeLessThan(5);
});

it('groups the tuple and its array errors without marking valid children invalid', async () => {
  const { view } = setup(['abc', 30, 'extra']);
  await tick();
  const group = view.container.querySelector('[data-tuple-control]')!;
  expect(group).not.toBeNull();
  expect(group.classList.contains('tuple-bordered')).toBe(true);
  expect(group.querySelector('[data-additional-item="2"]')).not.toBeNull();
  expect(group.querySelector('[role="alert"]')?.textContent).toContain('must NOT');
  const input = group.querySelector('input')!;
  expect(input.getAttribute('aria-invalid')).not.toBe('true');
  expect(group.querySelector('[data-tuple-heading]')?.getAttribute('data-invalid')).toBe('true');
});
it('supports a borderless tuple without removing its contents', async () => {
  const { view } = setup(['abc', 30], { showBorder: false });
  await tick();
  const group = view.container.querySelector('[data-tuple-control]')!;
  expect(group).not.toBeNull();
  expect(group.classList.contains('tuple-bordered')).toBe(false);
  expect(group.querySelectorAll('input').length).toBe(2);
});

it('uses per-position registry summaries and details without changing data on display', async () => {
  const original = [{ street: 'Main Street' }, ['111', '222', '333']];
  const { view, onchange } = setup(original, {}, {
    type: 'array',
    items: [
      { type: 'object', title: 'Address', properties: { street: { type: 'string' } } },
      { type: 'array', title: 'Phones', items: { type: 'string' } },
    ],
    additionalItems: false,
  } as any);
  await view.rerender({
    uischemas: [
      {
        tester: (schema: any) => (schema.title === 'Address' ? 10 : -1),
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            summary: { type: 'Control', scope: '#/properties/street' },
            detail: { type: 'Control', scope: '#/properties/street', label: 'Street editor' },
          },
        },
      },
      {
        tester: (schema: any) => (schema.title === 'Phones' ? 10 : -1),
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            summary: { type: 'Control', scope: '#' },
          },
        },
      },
    ],
  });
  await tick();
  const summaries = view.container.querySelectorAll('.tuple-summary');
  expect(summaries[0].textContent).toBe('Main Street');
  expect(summaries[1].textContent).toBe('111, 222 (+1 more)');
  (summaries[0] as HTMLElement).click();
  await tick();
  expect(document.querySelector('dialog[open], [role="dialog"]')).toBeNull();
  await page.getByRole('button', { name: /Edit Address/ }).click();
  await expect
    .poll(() => document.querySelector('dialog[open], [role="dialog"]')?.textContent)
    .toContain('Street editor');
  expect(
    onchange.mock.calls.every(
      ([event]) => JSON.stringify(event.data.value) === JSON.stringify(original),
    ),
  ).toBe(true);
});

it.each(['object', 'array'])(
  'empties a complex %s position without removing it or changing neighbors',
  async (type) => {
    const initial = type === 'object' ? { name: 'A' } : ['A'];
    const { view, onchange } = setup(['before', initial, 'after'], { showEmptyButton: true }, {
      type: 'array',
      items: [
        { type: 'string' },
        {
          type,
          title: 'Contents',
          ...(type === 'object'
            ? { properties: { name: { type: 'string' } } }
            : { items: { type: 'string' } }),
        },
        { type: 'string' },
      ],
      additionalItems: false,
    } as any);
    await tick();
    await page.getByRole('button', { name: 'Edit Contents', exact: true }).click();
    const before = onchange.mock.calls.length;
    const draftInput = document.querySelector<HTMLInputElement>(
      'dialog[open] input, [role="dialog"] input',
    );
    if (draftInput) {
      draftInput.value = 'Pending edit';
      draftInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await page.getByRole('button', { name: 'Clear', exact: true }).click();
    await page.getByRole('button', { name: 'Apply', exact: true }).click();
    const event = await waitForChange(onchange, before);
    expect(event.data.value).toEqual(['before', type === 'object' ? {} : [], 'after']);
    await view.rerender({ data: event.data });
    await page.getByRole('button', { name: 'Edit Contents', exact: true }).click();
    await expect.element(page.getByRole('button', { name: 'Clear', exact: true })).toBeDisabled();
  },
);
it.each([
  { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
  { type: 'object', minProperties: 1 },
  { type: 'array', minItems: 1, items: { type: 'string' } },
  { type: 'array', contains: { type: 'string' }, items: { type: 'string' } },
])('blocks restricted emptying for %j but permits it with restrict false', async (position) => {
  const initial = position.type === 'object' ? { name: 'A' } : ['A'];
  const { view, onchange } = setup([initial], { restrict: true, showEmptyButton: true }, {
    type: 'array',
    items: [{ ...position, title: 'Contents' }],
    additionalItems: false,
  } as any);
  await tick();
  await page.getByRole('button', { name: 'Edit Contents', exact: true }).click();
  await expect.element(page.getByRole('button', { name: 'Clear', exact: true })).toBeDisabled();
  await view.rerender({
    uischema: {
      type: 'Control',
      scope: '#/properties/value',
      options: { restrict: false, showEmptyButton: true },
    },
  });
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual([
    position.type === 'object' ? {} : [],
  ]);
});

it('guards emptying for missing values, disableRemove, and readonly changes', async () => {
  const { view, onchange } = setup([], { showEmptyButton: true }, {
    type: 'array',
    items: [{ type: 'object', title: 'Contents', properties: { name: { type: 'string' } } }],
    additionalItems: false,
  } as any);
  await tick();
  await page.getByRole('button', { name: 'Edit Contents', exact: true }).click();
  await expect.element(page.getByRole('button', { name: 'Clear', exact: true })).toBeDisabled();
  expect(onchange.mock.calls.every(([event]) => event.data.value.length === 0)).toBe(true);
  await view.rerender({
    data: { value: [{ name: 'A' }] },
    uischema: {
      type: 'Control',
      scope: '#/properties/value',
      options: { disableRemove: true, restrict: false, showEmptyButton: true },
    },
  });
  await expect.element(page.getByRole('button', { name: 'Clear', exact: true })).toBeDisabled();
  await view.rerender({
    readonly: true,
    uischema: { type: 'Control', scope: '#/properties/value', options: { showEmptyButton: true } },
  });
  await expect.element(page.getByRole('button', { name: 'Clear', exact: true })).toBeDisabled();
});

it('hides optional actions by default and cancels edits using translated UI action labels', async () => {
  const { view, onchange } = setup(
    [{ street: 'Original' }],
    { okLabel: 'save.key', cancelLabel: 'cancel.key' },
    {
      type: 'array',
      items: [{ type: 'object', title: 'Address', properties: { street: { type: 'string' } } }],
      additionalItems: false,
    } as any,
  );
  await view.rerender({
    i18n: {
      locale: 'en',
      translate: (key, fallback) =>
        key === 'save.key'
          ? 'Save draft'
          : key === 'cancel.key'
            ? 'Discard draft'
            : (fallback ?? key),
    },
  });
  await page.getByRole('button', { name: 'Edit Address', exact: true }).click();
  expect(document.body.textContent).not.toContain('Clear');
  expect(document.body.textContent).not.toContain('Remove');
  const before = onchange.mock.calls.length;
  const input = document.querySelector<HTMLInputElement>('input')!;
  input.value = 'Changed';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await page.getByRole('button', { name: 'Discard draft', exact: true }).click();
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(onchange.mock.calls.length).toBe(before);
  await page.getByRole('button', { name: 'Edit Address', exact: true }).click();
  expect(document.querySelector<HTMLInputElement>('input')!.value).toBe('Original');
  await page.getByRole('button', { name: 'Save draft', exact: true }).click();
  expect(onchange.mock.calls.length).toBe(before);
});

it('localizes action tooltips and reveals them on keyboard focus and hover', async () => {
  const { view } = setup([{ street: 'A' }], { showEmptyButton: true }, {
    type: 'array',
    items: [{ type: 'object', title: 'Address', properties: { street: { type: 'string' } } }],
    additionalItems: false,
  } as any);
  await view.rerender({
    i18n: {
      locale: 'en',
      translate: (key, fallback) =>
        key === 'composite.applyTooltip' ? 'Save this draft and close' : (fallback ?? key),
    },
  });
  await page.getByRole('button', { name: 'Edit Address', exact: true }).click();
  const apply = page.getByRole('button', { name: 'Apply', exact: true });
  const element = apply.element() as HTMLButtonElement;
  const hint = document.getElementById(element.getAttribute('aria-describedby')!)!;
  expect(hint.textContent).toBe('Save this draft and close');
  element.focus();
  await expect.poll(() => getComputedStyle(hint).visibility).toBe('visible');
  const clear = page.getByRole('button', { name: 'Clear', exact: true });
  await clear.hover();
  const clearHint = document.getElementById(clear.element().getAttribute('aria-describedby')!)!;
  expect(clearHint.textContent).toBe('Clear contents, keeping the object or array.');
  await expect.poll(() => getComputedStyle(clearHint).visibility).toBe('visible');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
});
