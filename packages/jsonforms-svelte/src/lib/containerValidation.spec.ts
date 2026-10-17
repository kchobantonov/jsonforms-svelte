import { expect, it } from 'vitest';
import type { ErrorObject } from 'ajv';
import { containerErrorIndex, containerValidation } from './containerValidation';
const error = (instancePath: string, params: object = {}, keyword = 'type'): ErrorObject => ({
  instancePath,
  params,
  keyword,
  schemaPath: '#/type',
});
it('indexes literal keys, required children and array boundaries once', () => {
  const errors = [error('/a.b/10', { missingProperty: 'c/d~e' }, 'required')];
  const index = containerErrorIndex(errors);
  expect(index.get('/a.b/10/c~1d~0e')).toBe(1);
  expect(index.get('/a.b/10')).toBe(1);
  expect(index.get('/a.b/1')).toBeUndefined();
  expect(index.get('/a/b')).toBeUndefined();
  expect(index.get('')).toBe(1);
  expect(containerErrorIndex(errors)).toBe(index);
});
it('honors local indicator overrides and hides only schema errors in hidden modes', () => {
  const core = {
    errors: [error('/node')],
    additionalErrors: [error('/draft')],
    validationMode: 'ValidateAndHide',
  };
  const ui = { type: 'Control', options: { showValidationIndicatorCount: true } };
  const config = { jsonformsExtended: { showValidationIndicator: true } };
  expect(containerValidation(core, [], ui, config)).toEqual({ show: true, count: 1 });
  expect(containerValidation(core, ['node'], ui, config)).toEqual({ show: false, count: 0 });
  expect(
    containerValidation(core, [], { ...ui, options: { showValidationIndicator: false } }, config),
  ).toEqual({ show: false });
  expect(
    containerValidation({ ...core, validationMode: 'ValidateAndShow' }, [], ui, config),
  ).toEqual({ show: true, count: 2 });
});
