import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import type { JsonSchema } from '@jsonforms/core';
import { mountControl, getBySelector } from '../testUtils';
import { entry as String } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as Password } from '../../src/lib/controls/PasswordControlRenderer.entry';
import { entry as MultiString } from '../../src/lib/controls/MultiStringControlRenderer.entry';
import { entry as StringMask } from '../../src/lib/controls/StringMaskControlRenderer.entry';
import { entry as AnyOfStringOrEnum } from '../../src/lib/controls/AnyOfStringOrEnumControlRenderer.entry';
import { entry as Number } from '../../src/lib/controls/NumberControlRenderer.entry';
import { entry as Integer } from '../../src/lib/controls/IntegerControlRenderer.entry';

afterEach(cleanup);

describe('constraints from the scoped field schema', () => {
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
    it(`uses the field maxLength for ${name}`, () => {
      const { view } = mountControl({
        renderers: [entry],
        propertySchema: schema as JsonSchema,
        options: { ...options, restrict: true },
      });
      const input = getBySelector<HTMLInputElement | HTMLTextAreaElement>(
        view.container,
        'input:not([type="hidden"]), textarea',
      );
      expect(input.getAttribute('maxlength')).toBe('8');
    });
  }

  for (const [type, entry, step] of [
    ['number', Number, 0.25],
    ['integer', Integer, 2],
  ] as const) {
    it(`uses field bounds and multipleOf for ${type}`, () => {
      const { view } = mountControl({
        renderers: [entry],
        propertySchema: { type, minimum: 2, maximum: 20, multipleOf: step },
        value: 4,
      });
      const input = getBySelector<HTMLInputElement>(view.container, 'input[type="number"]');
      expect(input.min).toBe('2');
      expect(input.max).toBe('20');
      expect(input.step).toBe(`${step}`);
    });
    it(`preserves explicit step precedence for ${type}`, () => {
      const { view } = mountControl({
        renderers: [entry],
        propertySchema: { type, multipleOf: step },
        options: { step: 3 },
      });
      expect(getBySelector<HTMLInputElement>(view.container, 'input[type="number"]').step).toBe(
        '3',
      );
    });
  }
});
