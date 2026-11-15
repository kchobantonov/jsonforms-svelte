import { expect, it } from 'vite-plus/test';
import type { ErrorObject } from 'ajv';
import { containerErrorIndex, containerValidation } from '../../../src/lib/containerValidation';
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
it('counts property-name failures at their literal child and ancestors', () => {
  const failure = error('/profile', { propertyName: 'a.b/c' }, 'propertyNames');
  const index = containerErrorIndex([failure]);
  expect(index.get('/profile/a.b~1c')).toBe(1);
  expect(index.get('/profile')).toBe(1);
  expect(index.get('/profile/a/b~1c')).toBeUndefined();
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
it('does not count provisional contains candidates as item errors', () => {
  const candidate = {
    ...error('/reviewers/0', { missingProperty: 'lead' }, 'required'),
    schemaPath: '#/properties/reviewers/contains/required',
  };
  const contains = {
    ...error('/reviewers', {}, 'contains'),
    schemaPath: '#/properties/reviewers/contains',
  };
  const own = {
    ...error('/reviewers/0/name'),
    schemaPath: '#/properties/reviewers/items/properties/name/type',
  };
  const ui = { type: 'Control' };
  const config = {
    jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
  };
  const core = { errors: [candidate, contains, own] };
  expect(containerValidation(core, ['reviewers'], ui, config)).toEqual({ show: true, count: 2 });
  expect(containerValidation(core, ['reviewers', '0'], ui, config)).toEqual({
    show: true,
    count: 1,
  });
  expect(containerValidation(core, ['reviewers', '0', 'lead'], ui, config)).toEqual({
    show: false,
    count: 0,
  });
});
