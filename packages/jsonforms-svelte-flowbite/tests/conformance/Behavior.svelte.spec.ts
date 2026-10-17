import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { page } from 'vitest/browser';
import { createAjv, RuleEffect, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import isEqual from 'lodash/isEqual';
import vectors from '../../../../tests/fixtures/spec-conformance/behavior.json';
import { mountControl, mountForm, waitForChange, waitForFormChange } from '../testUtils';
import { flowbiteRenderers } from '../../src/lib/renderers';
import { flowbiteCells } from '../../src/lib/cells';

afterEach(cleanup);
const vector = (id: string) => {
  const found = vectors.find((entry) => entry.id === id);
  if (!found) throw new Error(`Missing canonical behavior vector: ${id}`);
  return found;
};
it('outside-enum', async () => {
  const { input, expected } = vector('outside-enum');
  const { onchange, view } = mountControl({
    propertySchema: input.schema as JsonSchema,
    value: input.data,
    renderers: flowbiteRenderers,
  });
  await tick();
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  expect(view.container.querySelector('[aria-invalid="true"]')).toBeTruthy();
  const changes = onchange.mock.calls.filter(([event]) => !isEqual(event.data.value, input.data));
  expect(changes).toHaveLength(expected.changes!);
  expect(onchange.mock.lastCall?.[0].data.value).toEqual(expected.data);
});
it('tuple-fill-prefix', async () => {
  const { input, expected } = vector('tuple-fill-prefix');
  const { onchange, view } = mountControl({
    propertySchema: input.schema as JsonSchema,
    value: input.data,
    renderers: flowbiteRenderers,
  });
  await tick();
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  const before = onchange.mock.calls.length;
  const field = view.container.querySelectorAll<HTMLInputElement>('input')[input.edit!.index];
  field.value = String(input.edit!.value);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  expect((await waitForChange(onchange, before)).data.value).toEqual(expected.data);
  expect(onchange.mock.calls.slice(before)).toHaveLength(expected.changes!);
});
it('port-literal-key', async () => {
  const { input, expected } = vector('port-literal-key');
  const { onchange, view } = mountForm({
    schema: {
      type: 'object',
      properties: {
        'legacy.key': { type: 'string' },
        legacy: { type: 'object', properties: { key: { type: 'string' } } },
        '': { type: 'string' },
      },
    },
    uischema: { type: 'Control', scope: '#/properties/legacy.key' },
    data: input.data,
    renderers: flowbiteRenderers,
  });
  await tick();
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  const field = view.container.querySelector<HTMLInputElement>('input')!;
  expect(field.value).toBe('A');
  const before = onchange.mock.calls.length;
  field.value = 'D';
  field.dispatchEvent(new Event('input', { bubbles: true }));
  expect((await waitForFormChange(onchange, before)).data).toEqual(expected.data);
});

it('edits nested literal properties through referenced object schemas', async () => {
  const data = { 'outer.key': { 'child.name': 'Before', keep: 2 }, sibling: 'retained' };
  const { onchange, view } = mountForm({
    schema: {
      type: 'object',
      definitions: {
        child: {
          type: 'object',
          properties: {
            'child.name': { type: 'string', title: 'Name' },
            keep: { type: 'integer' },
          },
        },
      },
      properties: { 'outer.key': { $ref: '#/definitions/child' }, sibling: { type: 'string' } },
    },
    uischema: { type: 'Control', scope: '#/properties/outer.key' },
    data,
    renderers: flowbiteRenderers,
  });
  await tick();
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  const field = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
    (input) => input.value === 'Before',
  );
  expect(field).toBeTruthy();
  const before = onchange.mock.calls.length;
  field!.value = 'After';
  field!.dispatchEvent(new Event('input', { bubbles: true }));
  expect((await waitForFormChange(onchange, before)).data).toEqual({
    'outer.key': { 'child.name': 'After', keep: 2 },
    sibling: 'retained',
  });
});

it('span-gap', async () => {
  const { input, expected } = vector('span-gap');
  const { view } = mountForm({
    schema: { type: 'object' },
    data: {},
    renderers: flowbiteRenderers,
    uischema: {
      type: 'HorizontalLayout',
      options: { gridColumns: input.gridColumns, gap: input.gap },
      elements: [{ type: 'Label', text: 'Span', options: { layout: { span: input.span } } }],
    } as UISchemaElement,
  });
  view.container.style.width = `${input.width}px`;
  await tick();
  const item = view.container.querySelector<HTMLElement>('[data-layout-item]')!;
  expect(item.getBoundingClientRect().width).toBeCloseTo(expected.width!, 0);
});
it('visible-children', async () => {
  const { input, expected } = vector('visible-children');
  const { view } = mountForm({
    schema: { type: 'object' },
    data: {},
    renderers: flowbiteRenderers,
    uischema: {
      type: 'VerticalLayout',
      elements: input.visible!.map((visible, index) => ({
        type: 'Label',
        text: String(index),
        ...(!visible
          ? { rule: { effect: RuleEffect.HIDE, condition: { scope: '#', schema: {} } } }
          : {}),
      })),
    } as UISchemaElement,
  });
  await tick();
  const items = Array.from(view.container.querySelectorAll<HTMLElement>('[data-layout-item]'));
  expect(items.map((item) => Number(item.textContent!.trim()))).toEqual(
    expected.participatingIndices,
  );
  expect(items.length - 1).toBe(expected.gapCount);
  expect(
    items[1].getBoundingClientRect().top - items[0].getBoundingClientRect().bottom,
  ).toBeCloseTo(16, 0);
});
it('port-pattern-intersection', async () => {
  const { input, expected } = vector('port-pattern-intersection');
  const { view } = mountForm({
    schema: input.schema as JsonSchema,
    data: input.data,
    renderers: flowbiteRenderers,
    uischema: { type: 'Control', scope: '#' },
  });
  await tick();
  const labels = Array.from(view.container.querySelectorAll('label')).map((label) =>
    label.textContent!.trim().toLowerCase(),
  );
  for (const field of expected.editableFieldsAtX!) expect(labels).toContain(field);
  const values = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).map(
    (input) => input.value,
  );
  expect(values).toContain('a');
  expect(values).toContain('2');
});

it('accordion-close', async () => {
  const { input, expected } = vector('accordion-close');
  const { view, onchange } = mountForm({
    schema: { type: 'object' },
    data: {},
    renderers: flowbiteRenderers,
    uischema: {
      type: 'Categorization',
      options: { variant: 'accordion', initial: input.openCategory },
      elements: [
        {
          type: 'Category',
          name: input.openCategory,
          label: input.openCategory,
          elements: [{ type: 'Label', text: 'Content' }],
        },
      ],
    } as UISchemaElement,
  });
  await tick();
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  const before = onchange.mock.calls.length;
  const button = page.getByRole('button', { name: input.openCategory!, exact: true });
  await expect.element(button).toHaveAttribute('aria-expanded', 'true');
  await button.click();
  await expect.element(button).toHaveAttribute('aria-expanded', 'false');
  expect(
    view.container.querySelector('[aria-expanded="true"]')?.getAttribute('aria-label') ?? null,
  ).toBe(expected.openCategory);
  expect(onchange.mock.calls.slice(before)).toHaveLength(expected.dataChanges!);
});
it('port-numeric-intent', async () => {
  const { input, expected } = vector('port-numeric-intent');
  const { view, onchange } = mountControl({
    propertySchema: input.schema as JsonSchema,
    value: input.data,
    renderers: flowbiteRenderers,
  });
  await tick();
  async function choose(label: 'number' | 'integer') {
    const select = view.container.querySelector<HTMLSelectElement>('select')!;
    select.value = String(input.schema!.type!.indexOf(label));
    select.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();
  }
  await choose('number');
  const field = view.container.querySelector<HTMLInputElement>('input[type="number"]')!;
  const before = onchange.mock.calls.length;
  field.value = String(expected.data);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  await waitForChange(onchange, before);
  await choose('integer');
  await expect
    .poll(() => view.container.textContent?.includes('Enter a whole number.'))
    .toBe(expected.localWholeNumberError);
  expect(onchange.mock.lastCall?.[0].data.value).toBe(expected.data);
  expect(onchange.mock.lastCall?.[0].errors.length === 0).toBe(expected.documentValid);
  expect(
    view.container
      .querySelector<HTMLSelectElement>('select')!
      .selectedOptions[0].textContent?.toLowerCase(),
  ).toBe(expected.selectedEditor);
});

it('pending-delete', async () => {
  const { input, expected } = vector('pending-delete');
  const { view, onchange } = mountControl({
    propertySchema: { type: 'array', items: { type: 'string' } },
    value: input.data,
    renderers: flowbiteRenderers,
    cells: flowbiteCells,
    options: { table: true },
  });
  await tick();
  await vi.waitFor(() => expect(onchange).toHaveBeenCalled());
  const edit = input.actions!.find(
    (action) => typeof action === 'object' && 'queueEdit' in action,
  ) as { queueEdit: { index: number; value: string } };
  const remove = input.actions!.find(
    (action) => typeof action === 'object' && 'deleteIndex' in action,
  ) as { deleteIndex: number };
  const rows = view.container.querySelectorAll('tbody tr');
  const field = rows[edit.queueEdit.index].querySelector<HTMLInputElement>('input')!;
  field.value = edit.queueEdit.value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  const removeButton = rows[remove.deleteIndex].querySelector<HTMLButtonElement>(
    'button[aria-label="Delete button"]',
  )!;
  expect(removeButton).toBeTruthy();
  removeButton.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.value).toEqual(expected.data));
  // Wait beyond the control's debounce to catch writes from the removed row.
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(onchange.mock.lastCall?.[0].data.value).toEqual(expected.data);
});
it('port-cell-error-placement', async () => {
  const { input, expected } = vector('port-cell-error-placement');
  const { view } = mountControl({
    propertySchema: input.schema as JsonSchema,
    value: input.data,
    renderers: flowbiteRenderers,
    cells: flowbiteCells,
    options: { table: true },
  });
  await tick();
  const rows = view.container.querySelectorAll('tbody tr');
  const invalid = rows[expected.invalidCell!.row];
  expect(Boolean(invalid.querySelector('[aria-invalid="true"]'))).toBe(
    expected.localAccessibleFeedback,
  );
  expect(rows[0].querySelector('[aria-invalid="true"]')).toBeNull();
  expect(Boolean(invalid.querySelector('button[aria-label^="Validation error:"]'))).toBe(
    expected.localAccessibleFeedback,
  );
  expect(Boolean(view.container.querySelector('[data-array-summary]'))).toBe(
    expected.containerDescendantNotice,
  );
  expect(Boolean(invalid.querySelector('[role="alert"], [role="note"]'))).toBe(
    expected.ordinaryInlineCellHelp,
  );
});

it('port-branch-feedback', async () => {
  const { input, expected } = vector('port-branch-feedback');
  const ajv = createAjv();
  let branchCalls = 0;
  ajv.compile = new Proxy(ajv.compile, {
    apply(target, receiver, args) {
      const validate = Reflect.apply(target, receiver, args);
      if (args[0]?.maxLength === undefined || !args[0]?.definitions?.__jsonforms_root)
        return validate;
      return new Proxy(validate, {
        apply(fn, context, values) {
          branchCalls++;
          return Reflect.apply(fn, context, values);
        },
      });
    },
  });
  const { view, onchange } = mountForm({
    // The vector requests an explicit branch view. Titles identify those views
    // without changing any canonical validation assertions.
    schema: {
      ...input.schema,
      anyOf: input.schema!.anyOf!.map((branch, index) => ({
        ...branch,
        title: index === 0 ? 'Short text' : 'Long text',
      })),
    } as JsonSchema,
    data: input.data,
    ajv,
    renderers: flowbiteRenderers,
    uischema: { type: 'Control', scope: '#', options: { validateActiveBranch: true } },
  });
  await tick();
  const first = view.container.querySelector<HTMLElement>('[role="tab"]')!;
  expect(first).toBeTruthy();
  first.click();
  await vi.waitFor(() =>
    expect(Boolean(view.container.querySelector('input[aria-invalid="true"]'))).toBe(
      expected.localErrorWhenEnabled,
    ),
  );
  expect(onchange.mock.lastCall?.[0].errors.length === 0).toBe(expected.documentValidThroughout);
  expect(branchCalls).toBeGreaterThan(0);
  await view.rerender({
    uischema: { type: 'Control', scope: '#', options: { validateActiveBranch: false } },
  });
  await vi.waitFor(() =>
    expect(Boolean(view.container.querySelector('input[aria-invalid="true"]'))).toBe(
      expected.localErrorWhenDisabled,
    ),
  );
  branchCalls = 0;
  await view.rerender({ data: 'Still longer text' });
  await tick();
  expect(branchCalls > 0).toBe(expected.extraBranchValidationWhenDisabled);
  expect(onchange.mock.lastCall?.[0].errors.length === 0).toBe(expected.documentValidThroughout);
});
