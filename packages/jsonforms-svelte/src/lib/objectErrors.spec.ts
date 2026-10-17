import { expect, it } from 'vitest';
import type { ErrorObject } from 'ajv';
import { directObjectErrors, rejectedPropertyErrors } from './objectErrors';

const error = (
  keyword: string,
  instancePath: string,
  params: ErrorObject['params'] = {},
): ErrorObject => ({ keyword, instancePath, params, schemaPath: '#', message: keyword });

it('indexes direct targets without descendant, required-child or property-name feedback', () => {
  const own = error('minProperties', '/profile');
  const primary = [
    own,
    error('required', '/profile', { missingProperty: 'name' }),
    error('minLength', '/profile/name'),
    error('propertyNames', '/profile'),
    { ...error('pattern', '/profile'), propertyName: 'bad' },
  ];
  const host = [error('server', '/profile')];
  const result = directObjectErrors(primary, host, 'profile');
  expect(result).toEqual([own, host[0]]);
  expect(directObjectErrors(primary, host, 'profile')).toBe(result);
  expect(directObjectErrors([], host, 'profile')).toEqual(host);
  expect(primary).toHaveLength(5);
});

it('keeps escaped pointer targets and adjacent paths separate', () => {
  const slash = error('minProperties', '/a~1b');
  const primary = [slash, error('minProperties', '/a~1bc'), error('minProperties', '/a~0b')];
  expect(directObjectErrors(primary, undefined, 'a/b')).toEqual([slash]);
  expect(directObjectErrors(primary, undefined, 'a~b')).toEqual([primary[2]]);
  expect(directObjectErrors(primary, undefined, 'a')).toEqual([]);
});

it('keeps rejected literal property names at their own object heading', () => {
  const primary = ['', 'a.b', 'a/b'].map((name) =>
    error('additionalProperties', '/profile', { additionalProperty: name }),
  );
  const sibling = error('additionalProperties', '/profiles', { additionalProperty: 'other' });
  const all = [...primary, sibling, error('minLength', '/profile/name')];
  expect(rejectedPropertyErrors(all, undefined, 'profile')).toEqual(primary);
  expect(rejectedPropertyErrors(all, undefined, 'profiles')).toEqual([sibling]);
  expect(rejectedPropertyErrors(all, undefined, 'profile')).toBe(
    rejectedPropertyErrors(all, undefined, 'profile'),
  );
});
