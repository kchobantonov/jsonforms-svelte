import { expect, it } from 'vite-plus/test';
import type { ErrorObject } from 'ajv';
import {
  directObjectErrors,
  propertyNameErrors,
  rejectedPropertyErrors,
} from '../../../src/lib/objectErrors';

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

it('keeps direct, rejected and property-name errors on their exact dotted object owner', () => {
  const direct = [error('minProperties', '/a.b'), error('minProperties', '/a/b')];
  expect(directObjectErrors(direct, undefined, ['a.b'])).toEqual([direct[0]]);
  expect(directObjectErrors(direct, undefined, ['a', 'b'])).toEqual([direct[1]]);

  const rejected = [
    error('additionalProperties', '/a.b', { additionalProperty: 'extra' }),
    error('additionalProperties', '/a/b', { additionalProperty: 'extra' }),
  ];
  expect(rejectedPropertyErrors(rejected, undefined, ['a.b'])).toEqual([rejected[0]]);
  expect(rejectedPropertyErrors(rejected, undefined, ['a', 'b'])).toEqual([rejected[1]]);

  const names = [
    error('propertyNames', '/a.b', { propertyName: 'literal' }),
    error('propertyNames', '/a/b', { propertyName: 'nested' }),
  ];
  expect([...propertyNameErrors(names, undefined, ['a.b']).keys()]).toEqual(['literal']);
  expect([...propertyNameErrors(names, undefined, ['a', 'b']).keys()]).toEqual(['nested']);
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

it('routes propertyNames failures to the imported literal key once', () => {
  const specific = { ...error('minLength', '/telemetry'), propertyName: 'sensor-x' };
  const wrapper = error('propertyNames', '/telemetry', { propertyName: 'sensor-x' });
  const other = { ...error('pattern', '/telemetry'), propertyName: 'a/b' };
  const errors = propertyNameErrors(
    [specific, wrapper, other, error('propertyNames', '/telemetries', { propertyName: 'other' })],
    [error('server', '/telemetry', { propertyName: 'host-only' })],
    'telemetry',
  );
  expect(errors.get('sensor-x')).toEqual([specific]);
  expect(errors.get('a/b')).toEqual([other]);
  expect(errors.get('host-only')).toBeUndefined();
  expect(errors.size).toBe(2);
});
