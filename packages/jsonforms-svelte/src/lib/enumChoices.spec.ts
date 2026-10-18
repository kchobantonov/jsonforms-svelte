import type { JsonSchema } from '@jsonforms/core';
import { enumChoicesWithImportedValues, enumChoiceDisabled } from './enumChoices';
import { expect, it } from 'vitest';
import {
  stringSuggestions,
  addEnumValue,
  removeEnumValue,
  hasEnumValue,
  enumChoices,
  selectedEnumId,
} from './enumChoices';

const values = [0, '0', false, 'false', null, '', { id: 1 }, { id: 2 }, ['a'], ['a', 'b']];
const options = values.map((value) => ({ value, label: 'Same label' }));

it('uses distinct native IDs for all typed choices and duplicate labels', () => {
  const choices = enumChoices(options);
  expect(new Set(choices.map((choice) => choice.id)).size).toBe(values.length);
  expect(choices.map((choice) => choice.value)).toEqual(values);
});

it.each(values.map((value, index) => ({ value, index })))(
  'selects the original JSON type at index $index after a reload',
  ({ value, index }) => {
    expect(selectedEnumId(options, JSON.parse(JSON.stringify(value)))).toBe(`choice-${index}`);
  },
);

it('leaves absent and invalid values unselected without changing them', () => {
  expect(selectedEnumId(options, undefined)).toBe('');
  expect(selectedEnumId(options, { id: 3 })).toBe('');
});

it('uses content equality for multi-selection while preserving invalid siblings', () => {
  const data = [{ id: 1 }, 'invalid', null];
  expect(hasEnumValue(data, { id: 1 })).toBe(true);
  expect(addEnumValue(data, { id: 1 })).toEqual(data);
  expect(removeEnumValue(data, { id: 1 })).toEqual(['invalid', null]);
  expect(removeEnumValue(data, { id: 9 })).toEqual(data);
  expect(data).toEqual([{ id: 1 }, 'invalid', null]);
});

it('keeps imported choices visible with typed identity and preserves the data', () => {
  const data = [1, '1', null, { code: 'x' }, { code: 'x' }];
  const options = [{ value: 1, label: 'Number one' }];
  expect(enumChoicesWithImportedValues(options, data)).toEqual([
    ...options,
    { value: '1', label: '1' },
    { value: null, label: 'null' },
    { value: { code: 'x' }, label: '{"code":"x"}' },
  ]);
  expect(data).toHaveLength(5);
  expect(options).toHaveLength(1);
});
it('bounds add and remove independently and respects validation-only mode', () => {
  const bounds = { minItems: 1, maxItems: 2 };
  expect(enumChoiceDisabled(['A'], 'A', bounds, true)).toBe(true);
  expect(enumChoiceDisabled(['A'], 'B', bounds, true)).toBe(false);
  expect(enumChoiceDisabled(['A', 'B'], 'A', bounds, true)).toBe(false);
  expect(enumChoiceDisabled(['A', 'B'], 'C', bounds, true)).toBe(true);
  expect(enumChoiceDisabled(['A'], 'A', bounds, false)).toBe(false);
});

it('combines string suggestions across alternatives without duplicate native option keys', () => {
  expect(
    stringSuggestions({ anyOf: [{ enum: ['A', 'B'] }, { type: 'string' }, { enum: ['B', 'C'] }] }),
  ).toEqual(['A', 'B', 'C']);
});
const incompatibleSuggestions: JsonSchema[] = [
  { anyOf: [{ enum: ['A', 1] }, { type: 'string' }] },
  { anyOf: [{ enum: ['A'] }, { type: 'number' }] },
  { anyOf: [{ enum: ['A'] }, { type: 'string' }, {}] },
  { anyOf: [{ enum: ['A'] }, { type: 'string', const: 'B' }] },
];
it.each(incompatibleSuggestions.map((schema) => ({ schema })))(
  'does not choose a free-string editor for incompatible alternatives $schema',
  ({ schema }) => {
    expect(stringSuggestions(schema)).toBeUndefined();
  },
);
it('resolves local suggestion references and rejects unresolved or cyclic alternatives', () => {
  const root: JsonSchema = {
    definitions: {
      choices: { enum: ['A', 'B'] },
      text: { type: 'string' },
      loop: { $ref: '#/definitions/loop' },
    },
  };
  expect(
    stringSuggestions(
      { anyOf: [{ $ref: '#/definitions/choices' }, { $ref: '#/definitions/text' }] },
      root,
    ),
  ).toEqual(['A', 'B']);
  for (const $ref of [
    '#/definitions/missing',
    '#/definitions/loop',
    'https://example.test/schema',
  ]) {
    expect(stringSuggestions({ anyOf: [{ enum: ['A'] }, { $ref }] }, root)).toBeUndefined();
  }
});
