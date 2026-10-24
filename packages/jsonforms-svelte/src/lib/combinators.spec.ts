import { expect, it } from 'vite-plus/test';
import {
  branchChangeData,
  discardedByBranchChange,
  compositionViewIndex,
  clearedBranchValue,
  isArrayItemPath,
} from './combinators';

it('preserves only enclosing properties, including literal prototype-looking keys', () => {
  const data = JSON.parse('{"__proto__":{"keep":true},"shared":"outer","name":"old"}');
  const schema = { properties: JSON.parse('{"__proto__":{},"shared":{}}') };
  const value = branchChangeData(data, { name: 'new', shared: 'default' }, schema);
  expect(value).toEqual(JSON.parse('{"__proto__":{"keep":true},"shared":"outer","name":"new"}'));
  expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
  expect(discardedByBranchChange(data, schema)).toEqual({ name: 'old' });
});

it('excludes only valid distinct primitive discriminators under complex confirmation', () => {
  const schema = {
    oneOf: [
      { properties: { kind: { const: 'email' } } },
      { properties: { kind: { const: 'post' } } },
    ],
  };
  expect(discardedByBranchChange({ kind: 'email' }, schema, true)).toEqual({});
  expect(discardedByBranchChange({ kind: 'email', address: '' }, schema, true)).toEqual({
    address: '',
  });
  expect(discardedByBranchChange({ kind: 'unknown' }, schema, true)).toEqual({ kind: 'unknown' });
  expect(discardedByBranchChange({ kind: 'email' }, schema)).toEqual({ kind: 'email' });
});

it('derives an anyOf view until chosen and bounds indexes after branch replacement', () => {
  expect(compositionViewIndex(undefined, 1, 2)).toBe(1);
  expect(compositionViewIndex(0, 1, 2)).toBe(0);
  expect(compositionViewIndex(2, 0, 1)).toBe(0);
  expect(compositionViewIndex(undefined, -1, 2)).toBe(0);
  expect(compositionViewIndex(NaN, undefined, 0)).toBe(0);
});

it('keeps object-only array slots on clear without inventing values in other locations', () => {
  const branches = [{ type: 'object' }, { type: 'object' }];
  expect(clearedBranchValue(isArrayItemPath({ rows: [{}] }, 'rows.0'), branches)).toEqual({});
  expect(clearedBranchValue(isArrayItemPath([{}], '0'), branches)).toEqual({});
  expect(clearedBranchValue(isArrayItemPath({}, ''), branches)).toBeUndefined();
  expect(clearedBranchValue(isArrayItemPath({ '0': {} }, '0'), branches)).toBeUndefined();
  expect(clearedBranchValue(true, [...branches, { type: 'null' }])).toBeUndefined();
  expect(clearedBranchValue(true, [])).toBeUndefined();
});
