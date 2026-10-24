import type { JsonSchema7 } from '@jsonforms/core';
import { expect, it } from 'vite-plus/test';
import {
  discriminatorBranch,
  initialOneOfBranch,
  missingDiscriminatorError,
} from './discriminatorBranch';

it('uses distinct required constants even when other branch fields are invalid', () => {
  const schema: JsonSchema7 & { oneOf: JsonSchema7[] } = {
    oneOf: [
      {
        properties: { kind: { const: 'email' }, address: { type: 'string' } },
        required: ['kind', 'address'],
      },
      {
        properties: { kind: { const: 'post' }, zip: { type: 'string' } },
        required: ['kind', 'zip'],
      },
    ],
  };
  expect(discriminatorBranch(schema, schema, 'oneOf', { kind: 'post' })).toBe(1);
  expect(discriminatorBranch(schema, schema, 'oneOf', { kind: 'other' })).toBeUndefined();
  expect(
    discriminatorBranch(schema, schema, 'oneOf', Object.create({ kind: 'post' })),
  ).toBeUndefined();
  expect(
    discriminatorBranch({ oneOf: [schema.oneOf[0], schema.oneOf[0]] }, schema, 'oneOf', {
      kind: 'email',
    }),
  ).toBeUndefined();
  expect(
    discriminatorBranch(
      { oneOf: schema.oneOf.map((branch) => ({ ...branch, required: [] })) },
      schema,
      'oneOf',
      { kind: 'email' },
    ),
  ).toBeUndefined();
});

it('resolves branch references without expanding recursive descendants', () => {
  const schema: JsonSchema7 & { oneOf: JsonSchema7[] } = {
    definitions: {
      leaf: { type: 'object', properties: { kind: { const: 'leaf' } }, required: ['kind'] },
      branch: {
        type: 'object',
        properties: { kind: { const: 'branch' }, child: { $ref: '#' } },
        required: ['kind', 'child'],
      },
    },
    oneOf: [{ $ref: '#/definitions/leaf' }, { $ref: '#/definitions/branch' }],
  };
  expect(discriminatorBranch(schema, schema, 'oneOf', { kind: 'branch' })).toBe(1);
  expect(
    discriminatorBranch({ oneOf: [{ $ref: '#/missing' }] }, schema, 'oneOf', {}),
  ).toBeUndefined();
});

it('keeps empty and removed values unselected and preserves invalid nonempty values for editing', () => {
  expect(initialOneOfBranch(undefined, 0, 2)).toBeNull();
  expect(initialOneOfBranch({}, undefined, 2)).toBeNull();
  expect(initialOneOfBranch({}, 1, 2)).toBe(1);
  expect(initialOneOfBranch(false, undefined, 2)).toBe(0);
  expect(initialOneOfBranch({ kind: 'unknown' }, -1, 2)).toBe(0);
  expect(initialOneOfBranch({ kind: 'unknown' }, 3, 2)).toBe(0);
  expect(initialOneOfBranch({}, undefined, 0)).toBeNull();
});

it('routes only missing discriminator errors at the current node to its selector', () => {
  const schema = {
    oneOf: ['email', 'post'].map((kind) => ({
      properties: { kind: { const: kind } },
      required: ['kind'],
    })),
  };
  const error = {
    keyword: 'required',
    instancePath: '/rows/0',
    schemaPath: '#/required',
    params: { missingProperty: 'kind' },
  };
  expect(missingDiscriminatorError(schema, schema, 'rows.0', [error])).toBe(true);
  expect(missingDiscriminatorError(schema, schema, 'rows.1', [error])).toBe(false);
  expect(
    missingDiscriminatorError(schema, schema, 'rows.0', [
      { ...error, params: { missingProperty: 'name' } },
    ]),
  ).toBe(false);
  expect(missingDiscriminatorError({ oneOf: [schema.oneOf[0]] }, schema, 'rows.0', [error])).toBe(
    false,
  );
});
