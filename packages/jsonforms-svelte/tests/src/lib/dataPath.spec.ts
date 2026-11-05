import { expect, it } from 'vite-plus/test';
import { Resolve } from '@jsonforms/core';
import { dataPathSegments, dataPathToPointer, hasArrayParent } from '../../../src/lib/dataPath';
it('matches core lookup for literal bracket names rather than JavaScript property syntax', () => {
  const data = { 'code[0]': { 'a/b~c': 'literal' }, code: ['other'] };
  expect(Resolve.data(data, 'code[0].a/b~c')).toBe('literal');
  expect(dataPathSegments('code[0].a/b~c')).toEqual(['code[0]', 'a/b~c']);
  expect(dataPathToPointer('code[0].a/b~c')).toBe('/code[0]/a~1b~0c');
  expect(dataPathToPointer('')).toBe('');
  expect(dataPathToPointer('rows.0.value')).toBe('/rows/0/value');
});

it('uses own data members for prototype-looking names', () => {
  expect(Resolve.data({}, 'constructor')).toBeUndefined();
  expect(Resolve.data({}, '__proto__')).toBeUndefined();
  expect(Resolve.data({ constructor: 'own' }, 'constructor')).toBe('own');
});

it('keeps a literal dotted array parent distinct from its nested lookalike', () => {
  const data = { 'a.b': [true], a: { b: { 0: false } } };
  expect(hasArrayParent(data, ['a.b', '0'])).toBe(true);
  expect(hasArrayParent(data, ['a', 'b', '0'])).toBe(false);
  expect(hasArrayParent(data, ['constructor', '0'])).toBe(false);
  expect(hasArrayParent(data, [])).toBe(false);
});
