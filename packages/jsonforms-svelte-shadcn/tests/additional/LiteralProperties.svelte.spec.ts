import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { mountControl, waitForChange } from '../testUtils';
import { shadcnRenderers } from '../../src/lib/renderers';
afterEach(cleanup);
it.each([
  ['test.child', 'Original', 'Updated'],
  ['15', 'Numeric', 'Updated'],
  ['test.child', 'Original', ''],
])(
  'edits or clears nested literal property %s without changing its container',
  async (key, initial, next) => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: {
        type: 'object',
        additionalProperties: { type: 'object', additionalProperties: { type: 'string' } },
      },
      value: { 'group.parent': { 'test.child': 'Original', '15': 'Numeric' } },
    });
    const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
      (i) => i.value === initial,
    )!;
    expect(input).toBeTruthy();
    const before = onchange.mock.calls.length;
    input.value = next;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toEqual({
      'group.parent': { 'test.child': 'Original', '15': 'Numeric', [key]: next },
    });
  },
);
it.each(['test.child', '', '  spaced  ', '__proto__', 'a/b~c', 'имя', 'a\u0000b'])(
  'allows adding exact literal property name %j',
  async (name) => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: { type: 'object', additionalProperties: { type: 'string' } },
      value: {},
      options: { allowEmptyPropertyNames: true },
    });
    const input = view.container.querySelector<HTMLInputElement>('input')!;
    input.value = name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const add = view.container.querySelector<HTMLButtonElement>('button[aria-label*="Add"]')!;
    await vi.waitFor(() => expect(add.disabled).toBe(false));
    const before = onchange.mock.calls.length;
    add.click();
    expect((await waitForChange(onchange, before)).data.value).toEqual({ [name]: '' });
  },
);

it.each(['new.name', '', '  new name  '])(
  'renames a dotted property to exact name %j without changing its value',
  async (name) => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: { type: 'object', additionalProperties: { type: 'string' } },
      value: { 'old.name': 'Ada' },
      options: { allowEmptyPropertyNames: true },
    });
    view.container.querySelector<HTMLButtonElement>('button[aria-label="Rename button"]')!.click();
    await vi.waitFor(() => expect(document.querySelector('#shadcn-rename-property')).toBeTruthy());
    const input = document.querySelector<HTMLInputElement>('#shadcn-rename-property')!;
    input.value = name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const submit = document.querySelector<HTMLButtonElement>('form button[type="submit"]')!;
    await vi.waitFor(() => expect(submit.disabled).toBe(false));
    const before = onchange.mock.calls.length;
    submit.click();
    expect((await waitForChange(onchange, before)).data.value).toEqual({ [name]: 'Ada' });
  },
);

it.each(['', '  spaced  ', '__proto__', 'a/b~c', 'a.b'])(
  'edits an existing literal key %j and preserves sibling data',
  async (name) => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: { type: 'object', additionalProperties: { type: 'string' } },
      value: { [name]: 'Original', sibling: 'Untouched' },
    });
    const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
      (i) => i.value === 'Original',
    )!;
    expect(input).toBeTruthy();
    const before = onchange.mock.calls.length;
    input.value = 'Updated';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect((await waitForChange(onchange, before)).data.value).toEqual({
      [name]: 'Updated',
      sibling: 'Untouched',
    });
  },
);
it('preserves local references and reports validation for a dotted property', async () => {
  const { view, onchange } = mountControl({
    renderers: shadcnRenderers,
    propertySchema: {
      type: 'object',
      definitions: { text: { type: 'string', minLength: 3 } },
      additionalProperties: {
        type: 'object',
        properties: { text: { $ref: '#/properties/value/definitions/text' } },
      },
    },
    value: { 'a.b': { text: 'Original' } },
  });
  const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
    (i) => i.value === 'Original',
  )!;
  expect(input).toBeTruthy();
  const before = onchange.mock.calls.length;
  input.value = 'x';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  const change = await waitForChange(onchange, before);
  expect(change.data.value).toEqual({ 'a.b': { text: 'x' } });
  expect(change.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ keyword: 'minLength', instancePath: '/value/a.b/text' }),
    ]),
  );
  await vi.waitFor(() => expect(view.container.textContent).toContain('3'));
});
it('keeps a dotted property readonly under a readonly object', async () => {
  const { view } = mountControl({
    renderers: shadcnRenderers,
    propertySchema: { type: 'object', readOnly: true, additionalProperties: { type: 'string' } },
    value: { 'a.b': 'Original' },
  });
  const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
    (i) => i.value === 'Original',
  )!;
  expect(input).toBeTruthy();
  expect(input.disabled || input.readOnly).toBe(true);
});

it('deletes only the literal dotted property, leaving the nested property untouched', async () => {
  const { view, onchange } = mountControl({
    renderers: shadcnRenderers,
    propertySchema: {
      type: 'object',
      properties: { a: { type: 'object', properties: { b: { type: 'number' } } } },
      additionalProperties: { type: 'number' },
    },
    value: { 'a.b': 1, a: { b: 2 } },
  });
  const button = view.container.querySelector<HTMLButtonElement>(
    'button[aria-label="Delete button"]',
  )!;
  expect(button).toBeTruthy();
  const before = onchange.mock.calls.length;
  button.click();
  expect((await waitForChange(onchange, before)).data.value).toEqual({ a: { b: 2 } });
});

it.each([
  ['', { type: 'string' }],
  ['', true],
  ['regular', { type: 'string' }],
  ['regular', true],
] as const)(
  'aligns property %j actions with its label and above its editor (%j)',
  async (name, additionalProperties) => {
    const { view } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: { type: 'object', additionalProperties },
      value: { [name]: 'Original' },
    });
    await vi.waitFor(() => {
      const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
        (element) => element.value === 'Original',
      )!;
      expect(input).toBeTruthy();
      const select = view.container.querySelector<HTMLElement>('button[id$="-input-selector"]');
      if (additionalProperties === true) {
        expect(select).toBeTruthy();
        expect(
          Math.abs(select!.getBoundingClientRect().top - input.getBoundingClientRect().top),
        ).toBeLessThan(2);
      }
      for (const label of ['Rename button', 'Delete button']) {
        const action = view.container.querySelector<HTMLButtonElement>(
          `button[aria-label="${label}"]`,
        )!;
        expect(action).toBeTruthy();
        const row = action.parentElement!.parentElement!;
        const fieldLabel = row.querySelector('label')!;
        expect(fieldLabel).toBeTruthy();
        expect(
          Math.abs(action.getBoundingClientRect().top - fieldLabel.getBoundingClientRect().top),
        ).toBeLessThan(8);
        expect(action.getBoundingClientRect().bottom).toBeLessThanOrEqual(
          input.getBoundingClientRect().top,
        );
      }
    });
  },
);

it.each([false, true])(
  'gates blank property names with allowEmptyPropertyNames=%s',
  async (allowed) => {
    const { view, onchange } = mountControl({
      renderers: shadcnRenderers,
      propertySchema: { type: 'object', additionalProperties: { type: 'string' } },
      value: {},
      options: { allowEmptyPropertyNames: allowed },
    });
    const add = view.container.querySelector<HTMLButtonElement>('button[aria-label*="Add"]')!;
    await vi.waitFor(() => expect(add.disabled).toBe(!allowed));
    if (allowed) {
      const before = onchange.mock.calls.length;
      add.click();
      expect((await waitForChange(onchange, before)).data.value).toEqual({ '': '' });
    }
  },
);

it.each([
  { config: {}, options: {}, allowed: false },
  { config: { allowEmptyPropertyNames: true }, options: {}, allowed: true },
  {
    config: { allowEmptyPropertyNames: true },
    options: { allowEmptyPropertyNames: false },
    allowed: false,
  },
  { config: {}, options: { allowEmptyPropertyNames: true }, allowed: true },
])(
  'merges empty-name config $config and UI options $options',
  async ({ config, options, allowed }) => {
    const view = render(JsonForms, {
      props: {
        data: {},
        schema: { type: 'object', additionalProperties: { type: 'string' } },
        uischema: { type: 'Control', scope: '#', options },
        config,
        renderers: shadcnRenderers,
      },
    });
    await vi.waitFor(() => {
      const add = view.container.querySelector<HTMLButtonElement>('button[aria-label*="Add"]')!;
      expect(add.disabled).toBe(!allowed);
    });
  },
);

it('keeps an empty add-name draft quiet while rejecting duplicates', async () => {
  const { view } = mountControl({
    renderers: shadcnRenderers,
    propertySchema: { type: 'object', additionalProperties: { type: 'string' } },
    value: { '': 'Empty-key value', existing: 'Existing value' },
    options: { allowEmptyPropertyNames: true },
  });
  const input = view.container.querySelector<HTMLInputElement>('input')!;
  const add = view.container.querySelector<HTMLButtonElement>('button[aria-label*="Add"]')!;
  // Observe a nonempty duplicate first so initial form effects have settled.
  input.value = 'existing';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() => expect(view.container.textContent).toContain('already defined'));
  expect(add.disabled).toBe(true);
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() => expect(view.container.textContent).not.toContain('already defined'));
  expect(add.disabled).toBe(true);
});

it('keeps an empty property name visually blank with actions above its input', async () => {
  const { view } = mountControl({
    renderers: shadcnRenderers,
    propertySchema: { type: 'object', additionalProperties: { type: 'string' } },
    value: { '': 'Original' },
  });
  await vi.waitFor(() => {
    const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
      (element) => element.value === 'Original',
    )!;
    const action = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Rename button"]',
    )!;
    expect(input).toBeTruthy();
    expect(view.container.textContent).not.toContain('""');
    expect(action.getBoundingClientRect().bottom).toBeLessThanOrEqual(
      input.getBoundingClientRect().top,
    );
  });
});
