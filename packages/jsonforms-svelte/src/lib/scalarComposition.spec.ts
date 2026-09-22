import { expect, it } from 'vitest';
import { scalarCompositionSchema } from './scalarComposition';

it('keeps enclosing restrictions but never borrows alternative bounds or steps', () => {
  const schema = {
    type: 'integer',
    minimum: 0,
    maximum: 100,
    anyOf: [{ maximum: 10 }, { minimum: 20 }],
  };
  const before = JSON.stringify(schema);
  expect(scalarCompositionSchema(schema, {})).toEqual({
    type: 'integer',
    minimum: 0,
    maximum: 100,
  });
  expect(JSON.stringify(schema)).toBe(before);
  expect(
    scalarCompositionSchema({ type: 'integer', oneOf: [{ multipleOf: 3 }, { multipleOf: 5 }] }, {}),
  ).toEqual({ type: 'integer' });
});
it('infers only unambiguous scalar types while retaining outer metadata', () => {
  expect(
    scalarCompositionSchema({ title: 'Count', allOf: [{ type: 'integer' }, { minimum: 2 }] }, {}),
  ).toEqual({ title: 'Count', type: 'integer' });
  expect(
    scalarCompositionSchema(
      {
        anyOf: [
          { type: 'string', pattern: 'a' },
          { type: 'string', minLength: 3 },
        ],
      },
      {},
    ),
  ).toEqual({ type: 'string' });
  expect(
    scalarCompositionSchema({ anyOf: [{ type: 'integer' }, { minimum: 3 }] }, {}),
  ).toBeUndefined();
  expect(
    scalarCompositionSchema({ anyOf: [{ type: 'integer' }, { type: 'string' }] }, {}),
  ).toBeUndefined();
});
it('preserves choice, format and explicitly named branch presentations', () => {
  for (const branch of [
    { const: 3 },
    { enum: [3, 4] },
    { format: 'date' },
    { title: 'Alternative', minimum: 2 },
    { default: 3 },
    { readOnly: true },
    { customConstraint: true },
    { properties: { a: { type: 'string' } } },
  ]) {
    expect(
      scalarCompositionSchema({ type: 'integer', anyOf: [branch, { minimum: 0 }] } as any, {}),
    ).toBeUndefined();
  }
});
it('handles pure references and nested assertion compositions without recursive projection', () => {
  const root = { definitions: { small: { maximum: 10 }, loop: { $ref: '#/definitions/loop' } } };
  expect(
    scalarCompositionSchema(
      {
        type: 'integer',
        anyOf: [{ $ref: '#/definitions/small' }, { allOf: [{ minimum: 20 }, { maximum: 30 }] }],
      },
      root,
    ),
  ).toEqual({ type: 'integer' });
  expect(
    scalarCompositionSchema({ type: 'integer', anyOf: [{ $ref: '#/definitions/loop' }] }, root),
  ).toBeUndefined();
  expect(
    scalarCompositionSchema(
      { type: 'integer', anyOf: [{ $ref: '#/definitions/small', minimum: 0 }] },
      root,
    ),
  ).toBeUndefined();
});
