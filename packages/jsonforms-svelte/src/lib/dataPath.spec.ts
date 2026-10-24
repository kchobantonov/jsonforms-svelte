import { expect, it } from 'vite-plus/test';
import { Resolve } from '@jsonforms/core';
import { dataPathSegments, dataPathToPointer } from './dataPath';
it('matches core lookup for literal bracket names rather than JavaScript property syntax', () => {
  const data = { 'code[0]': { 'a/b~c': 'literal' }, code: ['other'] };
  expect(Resolve.data(data, 'code[0].a/b~c')).toBe('literal');
  expect(dataPathSegments('code[0].a/b~c')).toEqual(['code[0]', 'a/b~c']);
  expect(dataPathToPointer('code[0].a/b~c')).toBe('/code[0]/a~1b~0c');
  expect(dataPathToPointer('')).toBe('');
  expect(dataPathToPointer('rows.0.value')).toBe('/rows/0/value');
});
