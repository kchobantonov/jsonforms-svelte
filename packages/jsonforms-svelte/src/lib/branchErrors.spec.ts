import { createAjv } from '@jsonforms/core';
import { expect, it, vi } from 'vitest';
import { branchValidator, mergeBranchErrors } from './branchErrors';

it('reuses branch validators and isolates defaults from the document', () => {
  const ajv = createAjv({ useDefaults: true });
  const schema = {
    type: 'object',
    properties: { injected: { default: true } },
    required: ['missing'],
  };
  const root = { type: 'object', properties: { value: schema } };
  const compile = vi.spyOn(ajv, 'compile');
  const validate = branchValidator(ajv, schema, root);
  expect(branchValidator(ajv, schema, root)).toBe(validate);
  expect(compile).toHaveBeenCalledTimes(1);
  const data = {};
  expect(validate(data)).toBe(false);
  expect(data).toEqual({});
  expect(validate.errors?.[0].keyword).toBe('required');
});

it('deduplicates equivalent constraints without dropping distinct targets or mutating document errors', () => {
  const error = {
    keyword: 'required',
    instancePath: '/value',
    schemaPath: '#/anyOf/0/required',
    params: { missingProperty: 'name' },
    message: 'required',
  };
  const document = [error];
  const merged = mergeBranchErrors(document, [
    { ...error, schemaPath: '#/required' },
    { ...error, params: { missingProperty: 'city' } },
  ]);
  expect(merged).toHaveLength(2);
  expect(merged[0]).toBe(error);
  expect(document).toEqual([error]);
});

it('resolves local branch references against the original document', () => {
  const schema = { $ref: '#/definitions/person' };
  const root = {
    definitions: { person: { type: 'object', required: ['name'] } },
    anyOf: [schema, { type: 'object' }],
  };
  const validate = branchValidator(createAjv(), schema, root);
  expect(validate({})).toBe(false);
  expect(validate.errors?.[0].params).toEqual({ missingProperty: 'name' });
  expect(validate({ name: 'Ada' })).toBe(true);
});
