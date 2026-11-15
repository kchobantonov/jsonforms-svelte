import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { tick } from 'svelte';
import { page } from 'vite-plus/test/browser';
import Ajv2020 from 'ajv/dist/2020';
import type { JsonSchema, JsonSchema7 } from '@jsonforms/core';
import { mountForm, mountControl, waitForChange } from '../testUtils';
import { shadcnRenderers } from '../../src/lib/renderers';
afterEach(cleanup);
const schema = {
  type: 'array',
  items: [
    { type: 'string', title: 'Code' },
    { type: 'integer', title: 'Quantity' },
  ],
  additionalItems: false,
};
async function setup(
  value: unknown = [],
  options: Record<string, unknown> = { restrict: true },
  propertySchema: JsonSchema = schema,
) {
  return await mountControl({
    propertySchema,
    renderers: shadcnRenderers,
    value,
    options,
  });
}
it.each([
  { name: 'flat detail', configDetail: true, localDetail: false, first: 'Code' },
  { name: 'local detail', configDetail: false, localDetail: true, first: 'Quantity' },
])('keeps $name scoped to the tuple control', async ({ configDetail, localDetail, first }) => {
  const detail = {
    type: 'VerticalLayout',
    elements: [
      { type: 'Control', scope: '#/items/1' },
      { type: 'Control', scope: '#/items/0' },
    ],
  };
  const { view } = await mountControl({
    renderers: shadcnRenderers,
    propertySchema: schema,
    value: ['Code value', 2],
    config: configDetail ? { detail } : {},
    options: localDetail ? { detail } : {},
  });
  const content = view.container.textContent ?? '';
  const other = first === 'Code' ? 'Quantity' : 'Code';
  expect(content.indexOf(first)).toBeGreaterThanOrEqual(0);
  expect(content.indexOf(other)).toBeGreaterThanOrEqual(0);
  expect(content.indexOf(first)).toBeLessThan(content.indexOf(other));
});
async function edit(
  index: number,
  value: string,
  onchange: Awaited<ReturnType<typeof setup>>['onchange'],
) {
  const input = document.querySelectorAll<HTMLInputElement>('input')[index];
  const before = onchange.mock.calls.length;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  return await waitForChange(onchange, before);
}
it('diagnoses an undeclared layout position without creating an editor or changing data', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    const { view, onchange } = await setup(['kept', 2], {
      detail: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Control', scope: '#/items/9' },
          { type: 'Control', scope: '#/items/0' },
        ],
      },
    });
    expect(view.container.querySelectorAll('.tuple-field')).toHaveLength(1);
    expect(view.container.querySelector<HTMLInputElement>('.tuple-field input')?.value).toBe(
      'kept',
    );
    expect(view.container.querySelector('[data-tuple-position-diagnostic]')?.textContent).toContain(
      '#/items/9',
    );
    await vi.waitFor(() =>
      expect(warn.mock.calls.filter(([code]) => code === 'tuple.invalidScope')).toEqual([
        [
          'tuple.invalidScope',
          {
            severity: 'warning',
            message: 'The tuple layout names an undeclared or invalid position.',
            path: 'value.9',
            scope: '#/items/9',
          },
        ],
      ]),
    );
    expect(
      onchange.mock.calls.every(([change]) => JSON.stringify(change.data.value) === '["kept",2]'),
    ).toBe(true);
  } finally {
    warn.mockRestore();
  }
});

it('uses the default tuple row when a detail object has no layout type', async () => {
  const { view, onchange } = await setup(['kept', 2], {
    detail: { elements: [{ type: 'Control', scope: '#/items/1' }] },
  });
  expect(view.container.querySelectorAll('.tuple-field')).toHaveLength(2);
  expect(view.container.textContent).toContain('Code');
  expect(view.container.textContent).toContain('Quantity');
  expect(view.container.querySelector('[data-tuple-position-diagnostic]')).toBeNull();
  expect(
    onchange.mock.calls.every(([change]) => JSON.stringify(change.data.value) === '["kept",2]'),
  ).toBe(true);
});

it('keeps errors for positions omitted by an authored layout at the tuple boundary', async () => {
  const { view } = await setup(
    ['valid', 2],
    {
      detail: {
        type: 'VerticalLayout',
        elements: [{ type: 'Control', scope: '#/items/0' }],
      },
    },
    {
      type: 'array',
      items: [
        { type: 'string', title: 'Code' },
        { type: 'integer', title: 'Quantity', minimum: 10 },
      ],
      additionalItems: false,
    },
  );
  await expect
    .poll(() => view.container.querySelector('[data-tuple-omitted-errors]')?.textContent)
    .toContain('Quantity');
  expect(view.container.querySelector('[data-tuple-omitted-errors]')?.textContent).toContain(
    'must be >= 10',
  );
});

it('shows a forbidden boolean-schema position without hiding its neighbor', async () => {
  const { view, onchange } = await setup(['legacy', 'keep'], {}, {
    type: 'array',
    items: [false, { type: 'string', title: 'Code' }],
    additionalItems: false,
  } as unknown as JsonSchema);
  await expect.poll(() => view.container.textContent).toContain('Code');
  expect(view.container.textContent).toContain('No value is permitted at this position.');
  expect(view.container.querySelectorAll('.tuple-field').length).toBe(2);
  const input = view.container.querySelectorAll('.tuple-field')[1].querySelector('input')!;
  const before = onchange.mock.calls.length;
  input.value = 'changed';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const change = await waitForChange(onchange, before);
  expect(change.data.value).toEqual(['legacy', 'changed']);
  expect(
    change.errors.some(
      (error: unknown) =>
        typeof error === 'object' &&
        error !== null &&
        'instancePath' in error &&
        error.instancePath === '/value/0',
    ),
  ).toBe(true);
});

it('renders positional labels without populating missing values, then fills preceding defaults atomically', async () => {
  const { view, onchange } = await setup();
  await tick();
  expect(view.container.textContent).toContain('Code');
  expect(view.container.textContent).toContain('Quantity');
  expect(onchange.mock.calls.every(([event]) => event.data.value.length === 0)).toBe(true);
  expect((await edit(1, '30', onchange)).data.value).toEqual(['', 30]);
});
it.each(['hole', 'undefined'])(
  'fills a host-provided %s before an edited fixed position',
  async (missing) => {
    const source = new Array(2);
    if (missing === 'undefined') source[0] = undefined;
    source[1] = 30;
    const { onchange } = await setup(source);
    const change = await edit(1, '40', onchange);
    expect(change.data.value).toEqual(['', 40]);
    expect(Object.hasOwn(change.data.value as object, 0)).toBe(true);
    expect(source[0]).toBeUndefined();
  },
);
it('preserves empty strings and does not shift following positions', async () => {
  const { onchange } = await setup(['abc', 30]);
  await tick();
  expect((await edit(0, '', onchange)).data.value).toEqual(['', 30]);
});
it('holds numeric clearing as a draft rather than writing undefined or zero', async () => {
  const { onchange, view } = await setup(['abc', 30]);
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
  const { view, onchange } = await setup(
    [],
    { variant: 'tuple', vertical: true },
    {
      type: 'array',
      items: { type: 'number' },
      minItems: 2,
      maxItems: 2,
    },
  );
  await tick();
  expect(view.container.querySelector('.tuple-fields.vertical')).toBeTruthy();
  const fields = view.container.querySelectorAll('.tuple-fields.vertical > .tuple-field');
  expect(fields[0].getBoundingClientRect().height).toBeLessThan(140);
  expect(
    fields[1].getBoundingClientRect().top - fields[0].getBoundingClientRect().bottom,
  ).toBeLessThan(24);
  expect((await edit(1, '34', onchange)).data.value).toEqual([0, 34]);
});
it.each([
  {
    name: 'uniform array without equal bounds',
    schema: { type: 'array', items: { type: 'number' } },
    code: 'variant.unsupported',
    warningMessage: 'Tuple presentation requires positional schemas or equal non-negative bounds.',
  },
  {
    name: 'non-array schema',
    schema: { type: 'string' },
    code: 'variant.inapplicable',
    warningMessage: 'Tuple presentation requires an array schema.',
  },
])(
  'shows an author and accessible diagnostic for an unsupported $name',
  async ({ schema, code, warningMessage }) => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      const { view } = await setup([], { variant: 'tuple' }, schema as JsonSchema);
      await tick();
      expect(view.container.textContent).toContain('Tuple presentation requires');
      expect(warning).toHaveBeenCalledWith(code, {
        severity: 'warning',
        variant: 'tuple',
        path: 'value',
        message: warningMessage,
      });
    } finally {
      warning.mockRestore();
    }
  },
);
it('reports an unsupported tuple again after a valid schema interval', async () => {
  const ondiagnostic = vi.fn();
  const property = (fixed: boolean) => ({
    type: 'array',
    items: { type: 'string' },
    ...(fixed ? { minItems: 1, maxItems: 1 } : {}),
  });
  const root = (fixed: boolean) =>
    ({
      type: 'object',
      properties: { value: property(fixed) },
    }) as JsonSchema;
  const view = await render(JsonForms, {
    props: {
      schema: root(false),
      data: { value: [] },
      uischema: { type: 'Control', scope: '#/properties/value', options: { variant: 'tuple' } },
      renderers: shadcnRenderers,
      ondiagnostic,
    },
  });
  const count = () =>
    ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'variant.unsupported')
      .length;
  await vi.waitFor(() => expect(count()).toBe(1));
  await view.rerender({ schema: root(true) });
  await vi.waitFor(() =>
    expect(view.container.textContent).not.toContain(
      'Tuple presentation requires positional schemas',
    ),
  );
  await view.rerender({ schema: root(false) });
  await vi.waitFor(() => expect(count()).toBe(2));
});
it('reclassifies a live tuple request when the schema changes between scalar and array', async () => {
  const ondiagnostic = vi.fn();
  const root = (type: 'string' | 'array') =>
    ({
      type: 'object',
      properties: {
        value:
          type === 'string' ? { type: 'string' } : { type: 'array', items: { type: 'string' } },
        other: { type: 'string' },
      },
    }) as JsonSchema;
  const props = {
    schema: root('string'),
    data: { value: 'kept', other: 'kept' },
    uischema: { type: 'Control', scope: '#/properties/value', options: { variant: 'tuple' } },
    renderers: shadcnRenderers,
    ondiagnostic,
  };
  const view = await render(JsonForms, { props });
  const codes = () => ondiagnostic.mock.calls.map(([diagnostic]) => diagnostic.code);
  await vi.waitFor(() => expect(codes()).toEqual(['variant.inapplicable']));
  await view.rerender({ ...props, data: { value: 'kept', other: 'kept' } });
  expect(codes()).toEqual(['variant.inapplicable']);
  await view.rerender({ ...props, schema: root('array') });
  await vi.waitFor(() => expect(codes()).toEqual(['variant.inapplicable', 'variant.unsupported']));
  await view.rerender({ ...props, schema: root('string') });
  await vi.waitFor(() =>
    expect(codes()).toEqual([
      'variant.inapplicable',
      'variant.unsupported',
      'variant.inapplicable',
    ]),
  );
  expect(view.container.textContent).toContain('Tuple presentation requires an array schema.');
  await view.rerender({
    ...props,
    uischema: { type: 'Control', scope: '#/properties/other', options: { variant: 'tuple' } },
  });
  await vi.waitFor(() => expect(codes()).toHaveLength(4));
  expect(ondiagnostic.mock.calls[3]?.[0]).toMatchObject({
    code: 'variant.inapplicable',
    details: { path: 'other' },
  });
});
it('preserves excess values and offers corrective removal only for the tail', async () => {
  const { onchange, view } = await setup(['abc', 30, 'extra']);
  await tick();
  expect(onchange.mock.calls.every(([event]) => event.data.value.length === 3)).toBe(true);
  await expect.element(page.getByRole('button', { name: 'Add item', exact: true })).toBeDisabled();
  expect(view.container.querySelector('[data-additional-items-errors]')).not.toBeNull();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Delete Item 3', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['abc', 30]);
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-additional-items-errors]')).toBeNull(),
  );
  expect(view.container.textContent).not.toContain('Add item');
});
it('summarizes off-page tail errors without counting fixed positions and reveals the first error', async () => {
  const { view } = await setup(
    ['abc', 30, 'valid', 'bad'],
    {
      restrict: true,
      showValidationIndicatorCount: true,
      additionalItems: { pagination: { pageSize: 1 } },
    },
    {
      type: 'array',
      items: [
        { type: 'string', minLength: 5, title: 'Code' },
        { type: 'integer', title: 'Quantity' },
      ],
      additionalItems: { type: 'string', minLength: 4 },
    },
  );
  await expect.poll(() => view.container.querySelectorAll('[data-additional-item]').length).toBe(1);
  expect(view.container.querySelector('[data-additional-item="2"]')).not.toBeNull();
  await expect
    .poll(
      () => view.container.querySelector('[data-additional-items-summary-message]')?.textContent,
    )
    .toContain('1 error in items.');
  await page.getByRole('button', { name: 'Go to first error', exact: true }).click();
  await expect
    .poll(() => view.container.querySelector('[data-additional-item="3"]'))
    .not.toBeNull();
});

it('applies tail count restrictions and preserves the fixed prefix', async () => {
  const { onchange, view } = await setup(
    ['abc', 30],
    { restrict: true },
    {
      ...schema,
      additionalItems: { type: 'string' },
      minItems: 2,
      maxItems: 3,
    },
  );
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
it.each(['hole', 'undefined'])(
  'fills a host-provided %s in the fixed prefix before adding a tail item',
  async (missing) => {
    const source = new Array(2);
    if (missing === 'undefined') source[0] = undefined;
    source[1] = 30;
    const { onchange } = await setup(
      source,
      { restrict: true },
      {
        ...schema,
        additionalItems: { type: 'string' },
      },
    );
    const before = onchange.mock.calls.length;
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    const change = await waitForChange(onchange, before);
    expect(change.data.value).toEqual(['', 30, '']);
    expect(Object.hasOwn(change.data.value as object, 0)).toBe(true);
  },
);
it('holds tail Add when a missing fixed position has no unambiguous initial value', async () => {
  const source = new Array(2);
  source[1] = 30;
  const { view, onchange } = await setup(
    source,
    { restrict: true },
    {
      type: 'array',
      items: [{}, { type: 'integer' }],
      additionalItems: { type: 'string' },
    },
  );
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  expect(onchange.mock.calls).toHaveLength(before);
  expect(view.container.textContent).toContain('Enter Item 1 first.');
});
it('honors form readonly for fields and tail actions', async () => {
  const { view } = await setup(
    ['abc', 30],
    { restrict: true },
    {
      ...schema,
      additionalItems: { type: 'string' },
    },
  );
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
  const { onchange } = await setup(
    [],
    {},
    {
      type: 'array',
      items: [
        {
          type: 'object',
          title: 'Address',
          properties: { street: { type: 'string', title: 'Street' } },
        },
      ],
      additionalItems: false,
    },
  );
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

it('applies Control-local dialog geometry to a complex tuple position', async () => {
  await setup(
    [],
    { dialog: { width: 520, height: 300, maximizable: false, draggable: true, resizable: true } },
    {
      type: 'array',
      items: [
        {
          type: 'object',
          title: 'Address',
          properties: { street: { type: 'string', title: 'Street' } },
        },
      ],
      additionalItems: false,
    },
  );
  await page.getByRole('button', { name: /Edit Address/ }).click();
  const dialog = page.getByRole('dialog').element();
  expect(dialog.style.width).toBe('520px');
  expect(dialog.style.height).toBe('300px');
  expect(dialog.style.resize).toBe('both');
  expect(dialog.querySelector<HTMLElement>('[data-detail-dialog-header]')?.style.cursor).toBe(
    'move',
  );
  expect(page.getByRole('button', { name: 'Maximize' }).query()).toBeNull();
});

it('uses positional translations and retains root reference resolution', async () => {
  const { view, onchange } = await setup(
    [],
    {},
    {
      type: 'array',
      definitions: {
        coordinate: { type: 'number', title: 'X', i18n: 'coordinates.x' } as JsonSchema7,
      },
      items: [
        { $ref: '#/properties/value/definitions/coordinate' },
        { type: 'number', title: 'Y' },
      ],
      additionalItems: false,
    },
  );
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
  const { view, onchange } = await setup(
    [],
    {},
    {
      type: 'array',
      items: [{ enum: ['a', 'b'] }, { type: 'integer', title: 'Quantity' }],
      additionalItems: false,
    },
  );
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
  const { onchange } = await setup(
    ['abc', 30, 'one'],
    { restrict: false },
    {
      ...schema,
      additionalItems: { type: 'string' },
      maxItems: 3,
    },
  );
  await tick();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Add item', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['abc', 30, 'one', '']);
});

it('renders prefixItems with a draft-2020-12 validator', async () => {
  const { onchange } = await mountForm({
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
        } as unknown as JsonSchema7, // Core's schema type does not describe this Draft 2020-12 fixture.
      },
    },
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: shadcnRenderers,
    data: { value: [] },
    ajv: new Ajv2020({ strict: false, allErrors: true }),
  });
  await tick();
  expect((await edit(1, '34', onchange)).data.value).toEqual([0, 34]);
});

it('shows and clears a draft-2020-12 forbidden-tail error beside Additional Items', async () => {
  const { view, onchange } = await mountForm({
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          prefixItems: [{ type: 'number' }, { type: 'number' }],
          items: false,
        } as unknown as JsonSchema7,
      },
    },
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: shadcnRenderers,
    data: { value: [1, 2, 'legacy'] },
    ajv: new Ajv2020({ strict: false, allErrors: true }),
  });
  await expect.element(page.getByRole('button', { name: 'Add item', exact: true })).toBeDisabled();
  await expect
    .poll(() => view.container.querySelector('[data-additional-items-errors]'))
    .not.toBeNull();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Delete Item 3', exact: true }).click();
  expect((await waitForChange(onchange, before)).data.value).toEqual([1, 2]);
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-additional-items-errors]')).toBeNull(),
  );
});

it('prevents removal below minItems and obeys disableAdd/disableRemove', async () => {
  const { view } = await setup(
    ['abc', 30, 'note'],
    { restrict: true },
    {
      ...schema,
      additionalItems: { type: 'string' },
      minItems: 3,
    },
  );
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
  const { view } = await setup(
    ['name', 42],
    {},
    {
      type: 'array',
      items: [{ type: 'string', title: 'Name' }],
      additionalItems: true,
    },
  );
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
  const { view } = await setup(['abc', 30, 'extra']);
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
it.each([
  {
    name: 'minItems',
    value: ['abc'],
    schema: { ...schema, minItems: 2 },
    message: 'must NOT have fewer than 2 items',
  },
  {
    name: 'maxItems',
    value: ['abc', 30, 'extra'],
    schema: { ...schema, additionalItems: true, maxItems: 2 },
    message: 'must NOT have more than 2 items',
  },
  {
    name: 'uniqueItems',
    value: ['abc', 'abc'],
    schema: {
      ...schema,
      items: [{ type: 'string' }, { type: 'string' }],
      uniqueItems: true,
    },
    message: 'must NOT have duplicate items',
  },
])(
  'keeps $name feedback at the tuple boundary',
  async ({ value, schema: testedSchema, message }) => {
    const { view } = await setup(value, {}, testedSchema as JsonSchema);
    const group = view.container.querySelector('[data-tuple-control]')!;
    await expect
      .poll(() => group.querySelector(':scope > p[role="alert"]')?.textContent)
      .toContain(message);
    expect(
      [...group.querySelectorAll('input')].every(
        (input) => input.getAttribute('aria-invalid') !== 'true',
      ),
    ).toBe(true);
  },
);

it('supports a borderless tuple without removing its contents', async () => {
  const { view } = await setup(['abc', 30], { showBorder: false });
  await tick();
  const group = view.container.querySelector('[data-tuple-control]')!;
  expect(group).not.toBeNull();
  expect(group.classList.contains('tuple-bordered')).toBe(false);
  expect(group.querySelectorAll('input').length).toBe(2);
});

it('lets a position enable and relabel Clear over tuple-level false', async () => {
  const { view } = await setup(
    [{ street: 'Original' }],
    { showEmptyButton: false, emptyLabel: 'Tuple clear' },
    {
      type: 'array',
      items: [{ type: 'object', title: 'Address', properties: { street: { type: 'string' } } }],
      additionalItems: false,
    },
  );
  await view.rerender({
    uischemas: [
      {
        tester: (schema: JsonSchema) => (schema.title === 'Address' ? 10 : -1),
        uischema: {
          type: 'Control',
          scope: '#',
          options: { showEmptyButton: true, emptyLabel: 'Position clear' },
        },
      },
    ],
  });
  await page.getByRole('button', { name: 'Edit Address', exact: true }).click();
  await expect
    .element(page.getByRole('button', { name: 'Position clear', exact: true }))
    .toBeVisible();
  expect(page.getByRole('button', { name: 'Tuple clear', exact: true }).query()).toBeNull();
});

it.each([
  { name: 'default', config: {}, options: {}, bordered: true },
  { name: 'flat false', config: { showBorder: false }, options: {}, bordered: false },
  {
    name: 'local true over flat false',
    config: { showBorder: false },
    options: { showBorder: true },
    bordered: true,
  },
  {
    name: 'local false over flat true',
    config: { showBorder: true },
    options: { showBorder: false },
    bordered: false,
  },
  {
    name: 'removed namespaced option',
    config: { jsonformsExtended: { showBorder: false } },
    options: {},
    bordered: true,
  },
])(
  'resolves tuple border for $name without losing the group',
  async ({ config, options, bordered }) => {
    const { view } = await mountControl({
      renderers: shadcnRenderers,
      propertySchema: schema,
      value: ['abc', 30, 'extra'],
      config,
      options,
    });
    await tick();
    const group = view.container.querySelector('[data-tuple-control]')!;
    expect(group.classList.contains('tuple-bordered')).toBe(bordered);
    expect(group.querySelector('[data-tuple-heading]')).not.toBeNull();
    expect(group.querySelectorAll('input').length).toBeGreaterThanOrEqual(2);
    expect(group.querySelector('[role="alert"]')?.textContent).toContain('must NOT');
  },
);

it('summarizes tuple arrays and missing positions', async () => {
  const original = [['111', '222', '333']];
  const { view } = await setup(
    original,
    {},
    {
      type: 'array',
      items: [
        { type: 'array', title: 'Phones', items: { type: 'string' } },
        { type: 'array', title: 'Phones', items: { type: 'string' } },
      ],
      additionalItems: false,
    },
  );
  await view.rerender({
    uischemas: [
      {
        tester: (schema: JsonSchema) => (schema.title === 'Phones' ? 10 : -1),
        uischema: {
          type: 'Control',
          scope: '#',
          options: { summary: { type: 'Control', scope: '#' } },
        },
      },
    ],
  });
  await tick();
  const summaries = () =>
    Array.from(view.container.querySelectorAll('.tuple-summary'), (node) => node.textContent);
  expect(summaries()).toEqual(['111, 222 (+1 more)', 'Not set']);

  await view.rerender({ data: { value: [[]] } });
  await tick();
  expect(summaries()).toEqual(['0 items', 'Not set']);

  await view.rerender({ data: { value: [['111']] } });
  await tick();
  expect(summaries()).toEqual(['111', 'Not set']);
});

it('uses View details for object positions without a usable summary', async () => {
  const { view } = await setup(
    [{ name: 'Ada' }, { name: 'Grace' }],
    {},
    {
      type: 'array',
      items: [
        { type: 'object', title: 'No summary', properties: { name: { type: 'string' } } },
        { type: 'object', title: 'Missing field', properties: { name: { type: 'string' } } },
      ],
      additionalItems: false,
    },
  );
  await view.rerender({
    uischemas: [
      {
        tester: (schema: JsonSchema) => (schema.title === 'Missing field' ? 10 : -1),
        uischema: {
          type: 'Control',
          scope: '#',
          options: { summary: { type: 'Control', scope: '#/properties/absent' } },
        },
      },
    ],
  });
  await tick();
  expect(
    Array.from(view.container.querySelectorAll('.tuple-summary'), (node) => node.textContent),
  ).toEqual(['View details', 'View details']);
});

it('uses per-position registry summaries and details without changing data on display', async () => {
  const original = [{ street: 'Main Street' }, ['111', '222', '333']];
  const { view, onchange } = await setup(
    original,
    {},
    {
      type: 'array',
      items: [
        { type: 'object', title: 'Address', properties: { street: { type: 'string' } } },
        { type: 'array', title: 'Phones', items: { type: 'string' } },
      ],
      additionalItems: false,
    },
  );
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

it('keeps host tuple feedback visible while hidden document errors stay hidden and locale changes', async () => {
  const data = [{ street: 'x' }];
  const hostError = {
    instancePath: '/0/street',
    schemaPath: '#/host',
    keyword: 'host',
    params: {},
    message: 'Host feedback',
  };
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: [
          {
            type: 'object',
            title: 'Address',
            properties: { street: { type: 'string', minLength: 3, title: 'Street' } },
          },
        ],
        additionalItems: false,
      },
      uischema: { type: 'Control', scope: '#' },
      data,
      additionalErrors: [hostError],
      validationMode: 'ValidateAndShow',
      renderers: shadcnRenderers,
      i18n: {
        locale: 'en',
        translateError: (error: { keyword: string }) =>
          error.keyword === 'host' ? 'Host English' : 'Document English',
      },
    },
  });
  const feedback = () => view.container.querySelector('.tuple-field > [role="alert"]')?.textContent;
  await expect.poll(feedback).toContain('Host English');
  await expect.poll(feedback).toContain('Document English');
  await view.rerender({ validationMode: 'ValidateAndHide' });
  await expect.poll(feedback).not.toContain('Document English');
  expect(feedback()).toContain('Host English');
  await view.rerender({ validationMode: 'NoValidation' });
  expect(feedback()).toContain('Host English');
  await view.rerender({
    i18n: {
      locale: 'bg',
      translateError: (error: { keyword: string }) =>
        error.keyword === 'host' ? 'Грешка от сървъра' : 'Грешка в документа',
    },
  });
  await expect.poll(feedback).toContain('Грешка от сървъра');
  expect(feedback()).not.toContain('Host English');
  expect(data).toEqual([{ street: 'x' }]);
});

it.each(['object', 'array'])(
  'empties a complex %s position without removing it or changing neighbors',
  async (type) => {
    const initial = type === 'object' ? { name: 'A' } : ['A'];
    const { view, onchange } = await setup(
      ['before', initial, 'after'],
      { showEmptyButton: true },
      {
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
      },
    );
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
  const { view, onchange } = await setup(
    [initial],
    { restrict: true, showEmptyButton: true },
    {
      type: 'array',
      items: [{ ...position, title: 'Contents' }],
      additionalItems: false,
    },
  );
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
  const { view, onchange } = await setup(
    [],
    { showEmptyButton: true },
    {
      type: 'array',
      items: [{ type: 'object', title: 'Contents', properties: { name: { type: 'string' } } }],
      additionalItems: false,
    },
  );
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
  const { view, onchange } = await setup(
    [{ street: 'Original' }],
    { okLabel: 'save.key', cancelLabel: 'cancel.key' },
    {
      type: 'array',
      items: [{ type: 'object', title: 'Address', properties: { street: { type: 'string' } } }],
      additionalItems: false,
    },
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
  expect(page.getByRole('button', { name: 'Clear', exact: true }).query()).toBeNull();
  expect(page.getByRole('button', { name: 'Remove', exact: true }).query()).toBeNull();
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
  const { view } = await setup(
    [{ street: 'A' }],
    { showEmptyButton: true },
    {
      type: 'array',
      items: [{ type: 'object', title: 'Address', properties: { street: { type: 'string' } } }],
      additionalItems: false,
    },
  );
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

it('keeps tail editors bound to their current positions after removal and external replacement', async () => {
  const { view, onchange } = await setup(
    ['fixed', 30, 'first', 'second'],
    { restrict: true },
    {
      ...schema,
      additionalItems: { type: 'string' },
    },
  );
  await tick();
  const before = onchange.mock.calls.length;
  await page.getByRole('button', { name: 'Delete Item 3', exact: true }).click();
  const removed = await waitForChange(onchange, before);
  expect(removed.data.value).toEqual(['fixed', 30, 'second']);
  await view.rerender({ data: removed.data });
  await expect
    .poll(() => document.querySelectorAll<HTMLInputElement>('input')[2]?.value)
    .toBe('second');
  await view.rerender({ data: { value: ['replaced', 40, 'external', 'external'] } });
  await expect
    .poll(() => document.querySelectorAll<HTMLInputElement>('input')[2]?.value)
    .toBe('external');
  expect((await edit(3, 'edited', onchange)).data.value).toEqual([
    'replaced',
    40,
    'external',
    'edited',
  ]);
});

it('keeps GENERATE through a tuple field Control when a registry matches its object editor', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: [{ type: 'object', properties: { name: { type: 'string' } } }],
        additionalItems: false,
      },
      uischema: { type: 'Control', scope: '#', options: { detail: 'generate' } },
      data: [{ name: 'Ada' }],
      renderers: shadcnRenderers,
      uischemas: [{ tester: () => 10, uischema: { type: 'VerticalLayout', elements: [] } }],
    },
  });
  await tick();
  expect(view.container.textContent).toContain('Item 1');
  await page.getByRole('button', { name: 'Edit Item 1', exact: true }).click();
  await expect.element(page.getByRole('textbox', { name: /Name/ })).toHaveValue('Ada');
});

it('creates an own constructor-named field inside a tuple position detail', async () => {
  const { onchange } = await setup(
    [{}],
    { detail: 'generate' },
    {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: { constructor: { type: 'string', title: 'Constructor field' } },
        },
      ],
      additionalItems: false,
    },
  );
  await page.getByRole('button', { name: 'Edit Item 1', exact: true }).click();
  await page.getByRole('textbox', { name: 'Constructor field', exact: true }).fill('Owned');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data.value).toEqual([{ constructor: 'Owned' }]),
  );
});
