import { afterEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import type { JsonSchema } from '@jsonforms/core';
import { mountControl, getBySelector, waitForChange } from '../testUtils';
import { entry as String } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as Password } from '../../src/lib/controls/PasswordControlRenderer.entry';
import { entry as MultiString } from '../../src/lib/controls/MultiStringControlRenderer.entry';
import { entry as StringMask } from '../../src/lib/controls/StringMaskControlRenderer.entry';
import { entry as AnyOfStringOrEnum } from '../../src/lib/controls/AnyOfStringOrEnumControlRenderer.entry';
import { entry as Number } from '../../src/lib/controls/NumberControlRenderer.entry';
import { entry as Integer } from '../../src/lib/controls/IntegerControlRenderer.entry';

afterEach(cleanup);

describe('constraints from the scoped field schema', () => {
  it.each([
    { name: 'default', config: undefined, local: undefined, stored: '12345678' },
    { name: 'flat false', config: { restrict: false }, local: undefined, stored: '123456789' },
    { name: 'local false', config: { restrict: true }, local: false, stored: '123456789' },
    { name: 'local true', config: { restrict: false }, local: true, stored: '12345678' },
    {
      name: 'removed namespace',
      config: { jsonformsExtended: { restrict: false } },
      local: undefined,
      stored: '12345678',
    },
  ])('applies $name restriction to string maxLength', async ({ config, local, stored }) => {
    const { view, onchange } = await mountControl({
      renderers: [String],
      propertySchema: { type: 'string', maxLength: 8 },
      options: local === undefined ? {} : { restrict: local },
      config,
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input:not([type="hidden"])');
    const before = onchange.mock.calls.length;
    input.value = '123456789';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    const change = await waitForChange(onchange, before);
    expect(change.data.value).toBe(stored);
  });

  const cases = [
    { entry: String, name: 'string', schema: { type: 'string', maxLength: 8 }, options: {} },
    {
      entry: Password,
      name: 'password',
      schema: { type: 'string', format: 'password', maxLength: 8 },
      options: { format: 'password' },
    },
    {
      entry: MultiString,
      name: 'multiline',
      schema: { type: 'string', maxLength: 8 },
      options: { multi: true },
    },
    {
      entry: StringMask,
      name: 'masked',
      schema: { type: 'string', maxLength: 8 },
      options: { mask: '********' },
    },
    {
      entry: AnyOfStringOrEnum,
      name: 'free-entry choice',
      schema: { maxLength: 8, anyOf: [{ type: 'string' }, { type: 'string', enum: ['short'] }] },
      options: {},
    },
  ];

  for (const { entry, name, schema, options } of cases) {
    it(`uses the field maxLength for ${name}`, async () => {
      const { view, onchange } = await mountControl({
        renderers: [entry],
        propertySchema: schema as JsonSchema,
        options: { ...options, restrict: true },
      });
      const input = getBySelector<HTMLInputElement | HTMLTextAreaElement>(
        view.container,
        'input:not([type="hidden"]), textarea',
      );
      // Native maxlength counts UTF-16 units; the renderer enforces schema length.
      expect(input.hasAttribute('maxlength')).toBe(false);
      const before = onchange.mock.calls.length;
      input.value = '123456789';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
      const change = await waitForChange(onchange, before);
      expect(change.data.value).toBe('12345678');
    });
  }

  for (const [type, entry, step] of [
    ['number', Number, 0.25],
    ['integer', Integer, 2],
  ] as const) {
    it(`uses field bounds and multipleOf for ${type}`, async () => {
      const { view } = await mountControl({
        renderers: [entry],
        propertySchema: { type, minimum: 2, maximum: 20, multipleOf: step },
        value: 4,
      });
      const input = getBySelector<HTMLInputElement>(view.container, 'input[type="number"]');
      expect(input.min).toBe('2');
      expect(input.max).toBe('20');
      expect(input.step).toBe(`${step}`);
    });
    it(`preserves explicit step precedence for ${type}`, async () => {
      const { view } = await mountControl({
        renderers: [entry],
        propertySchema: { type, multipleOf: step },
        options: { step: 3 },
      });
      expect(getBySelector<HTMLInputElement>(view.container, 'input[type="number"]').step).toBe(
        '3',
      );
    });
    it(`uses local step rather than undeclared flat config for ${type}`, async () => {
      const { view } = await mountControl({
        renderers: [entry],
        propertySchema: { type, multipleOf: step },
        config: { step: 5 },
      });
      const input = getBySelector<HTMLInputElement>(view.container, 'input[type="number"]');
      expect(input.step).toBe(`${step}`);
      await view.rerender({
        uischema: { type: 'Control', scope: '#/properties/value', options: { step: 3 } },
      });
      expect(input.step).toBe('3');
    });
  }
});
