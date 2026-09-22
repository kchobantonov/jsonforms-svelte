import demoSchema from '../../../jsonforms-svelte-demo-common/src/lib/examples/scalar-composition/schema.json';
import demoUI from '../../../jsonforms-svelte-demo-common/src/lib/examples/scalar-composition/uischema.json';
import demoData from '../../../jsonforms-svelte-demo-common/src/lib/examples/scalar-composition/data.json';
import type { JsonSchema, UISchemaElement, Translator } from '@jsonforms/core';
import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { tick } from 'svelte';
import { mountControl, mountForm, waitForChange } from '../testUtils';
import { flowbiteRenderers } from '../../src/lib/renderers';
afterEach(cleanup);
it.each([
  { keyword: 'anyOf', branches: [{ maximum: 10 }, { minimum: 20 }], valid: [5, 25], invalid: 15 },
  {
    keyword: 'oneOf',
    branches: [{ multipleOf: 3 }, { multipleOf: 5 }],
    valid: [6, 10],
    invalid: 15,
  },
  { keyword: 'allOf', branches: [{ minimum: 2 }, { maximum: 10 }], valid: [3, 9], invalid: 15 },
])(
  'renders validation-only $keyword as one scalar input with full validation',
  async ({ keyword, branches, valid, invalid }) => {
    const { view, onchange } = mountControl({
      renderers: flowbiteRenderers,
      propertySchema: { type: 'integer', [keyword]: branches },
      value: valid[0],
    });
    await tick();
    expect(view.container.querySelectorAll('input')).toHaveLength(1);
    expect(
      view.container.querySelector(
        '[role="tablist"],[role="combobox"],select,[aria-haspopup="listbox"]',
      ),
    ).toBeNull();
    expect(view.container.textContent).toContain('Value');
    let input = view.container.querySelector<HTMLInputElement>('input')!;
    // Neither alternative branch may dictate the control's range or step.
    if (keyword !== 'allOf') {
      expect(input.min).toBe('');
      expect(input.max).toBe('');
      expect(['', '1', 'any']).toContain(input.step);
    }
    for (const value of [valid[1], invalid, valid[0]]) {
      const before = onchange.mock.calls.length;
      input.value = String(value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const event = await waitForChange(onchange, before);
      expect(event.data.value).toBe(value);
      expect(event.errors.length === 0).toBe(value !== invalid);
      await view.rerender({ data: event.data });
      await tick();
      input = view.container.querySelector<HTMLInputElement>('input')!;
      expect(input.getAttribute('aria-invalid') === 'true').toBe(value === invalid);
      if (value === invalid && keyword === 'anyOf') {
        expect(view.container.textContent).toContain('does not match any permitted alternative');
      }
      if (value === invalid && keyword === 'oneOf') {
        expect(view.container.textContent).toContain('matches more than one permitted alternative');
      }
    }
  },
);

it('renders the shared scalar-composition demo without branch selectors', async () => {
  const { view, onchange } = mountForm({
    renderers: flowbiteRenderers,
    schema: demoSchema as JsonSchema,
    uischema: demoUI as UISchemaElement,
    data: demoData,
  });
  await tick();
  expect(view.container.querySelectorAll('input')).toHaveLength(7);
  expect(
    view.container.querySelector(
      '[role="tablist"],[role="combobox"],select,[aria-haspopup="listbox"]',
    ),
  ).toBeNull();
  expect(view.container.textContent).toContain('Min Length');
  const event = onchange.mock.lastCall?.[0];
  expect(event.data).toEqual(demoData);
  expect(event.errors).toHaveLength(1);
  expect(event.errors[0].instancePath).toBe('/invalidMultiple');
  expect(event.errors[0].keyword).toBe('oneOf');
});

it('localizes composition feedback, respects hidden validation, and preserves host errors', async () => {
  const { view, onchange } = mountControl({
    renderers: flowbiteRenderers,
    propertySchema: { type: 'integer', oneOf: [{ multipleOf: 3 }, { multipleOf: 5 }] },
    value: 15,
  });
  await view.rerender({
    i18n: {
      locale: 'en',
      translate: ((key: string, fallback?: string) =>
        key === 'composition.multipleMatches'
          ? 'Several alternatives match'
          : fallback) as Translator,
    },
  });
  await tick();
  expect(view.container.textContent).toContain('Several alternatives match');
  const hostError = {
    instancePath: '/value',
    schemaPath: '#/host',
    keyword: 'host',
    params: {},
    message: 'Host feedback',
  };
  await view.rerender({ validationMode: 'ValidateAndHide', additionalErrors: [hostError] });
  await tick();
  expect(view.container.textContent).not.toContain('Several alternatives match');
  expect(view.container.textContent).toContain('Host feedback');
  await view.rerender({ validationMode: 'ValidateAndShow', additionalErrors: [] });
  await tick();
  expect(view.container.textContent).toContain('Several alternatives match');
  expect(view.container.textContent).not.toContain('Host feedback');
  const original = onchange.mock.lastCall?.[0].errors.find(
    (error: { keyword: string }) => error.keyword === 'oneOf',
  );
  expect(original.message).not.toBe('Several alternatives match');
});
