import { describe, expect, it } from 'vite-plus/test';
import type { JsonFormsCore } from '@jsonforms/core';
import {
  collectionErrorPositions,
  firstAddedCollectionIndex,
  resolvePagination,
} from './collectionPagination';
describe('collection pagination defaults', () => {
  it('defaults to five items while preserving explicit page sizes', () => {
    expect(resolvePagination(undefined, {}, 'array', true).size).toBe(5);
    expect(resolvePagination(true, {}, 'additionalProperties', false).size).toBe(5);
    expect(resolvePagination({ pageSize: 10 }, {}, 'array', true).size).toBe(10);
  });
  it('separates array and property defaults and honors false', () => {
    const config = {
      jsonformsExtended: {
        array: { pagination: { pageSize: 5 } },
        additionalProperties: { pagination: false },
      },
    };
    expect(resolvePagination(undefined, config, 'array', true)).toMatchObject({
      enabled: true,
      size: 5,
    });
    expect(resolvePagination(undefined, config, 'additionalProperties', false).enabled).toBe(false);
    expect(resolvePagination(false, config, 'array', true).enabled).toBe(false);
    expect(
      resolvePagination(undefined, { pagination: true }, 'additionalProperties', false).enabled,
    ).toBe(false);
    expect(
      resolvePagination(
        undefined,
        { additionalProperties: { pagination: true }, jsonformsExtended: { pagination: true } },
        'additionalProperties',
        false,
      ).enabled,
    ).toBe(false);
  });
  it('enables additional sections by default and supports scoped boolean overrides', () => {
    for (const kind of ['additionalItems', 'additionalProperties'] as const) {
      expect(resolvePagination(undefined, {}, kind)).toMatchObject({
        enabled: true,
        size: 5,
      });
      const config = { jsonformsExtended: { [kind]: { pagination: false } } };
      expect(resolvePagination(undefined, config, kind).enabled).toBe(false);
      expect(resolvePagination(true, config, kind).enabled).toBe(true);
      expect(resolvePagination(false, {}, kind).enabled).toBe(false);
    }
  });
  it('includes the initial size and filters invalid choices without mutating options', () => {
    const options = { pageSize: 7, pageSizeOptions: [5, 5, 0, 10] };
    expect(resolvePagination(options, {}, 'array', true).choices).toEqual([5, 7, 10]);
    expect(options.pageSizeOptions).toEqual([5, 5, 0, 10]);
  });
});

it('reveals an inserted logical key rather than assuming the new item is last', () => {
  expect(firstAddedCollectionIndex(['a', 'c', 'd'], ['a', 'b', 'c', 'd'])).toBe(1);
  expect(firstAddedCollectionIndex([0, 1], [0, 1, 2])).toBe(2);
  expect(firstAddedCollectionIndex(['a', 'b'], ['b', 'a'])).toBe(-1);
});

it('routes paged errors to literal bracket keys and preserves host errors when validation is hidden', () => {
  const core = {
    errors: [
      { instancePath: '/rows[0]/1/name', keyword: 'minLength', schemaPath: '', params: {} },
      { instancePath: '/rows/0/0/name', keyword: 'minLength', schemaPath: '', params: {} },
    ],
    additionalErrors: [
      { instancePath: '/rows[0]/2/a~1b~0c', keyword: 'server', schemaPath: '', params: {} },
    ],
  } as JsonFormsCore;
  expect(collectionErrorPositions(core, 'rows[0]', [0, 1, 2])).toEqual([
    { index: 1, count: 1 },
    { index: 2, count: 1 },
  ]);
  expect(collectionErrorPositions(core, 'rows.0', [0, 1, 2])).toEqual([{ index: 0, count: 1 }]);
  expect(
    collectionErrorPositions({ ...core, validationMode: 'ValidateAndHide' }, 'rows[0]', [0, 1, 2]),
  ).toEqual([{ index: 2, count: 1 }]);
});

it('separates paged errors on literal and nested dotted arrays', () => {
  const core = {
    errors: [
      { instancePath: '/a.b/0/name', keyword: 'minLength', schemaPath: '', params: {} },
      { instancePath: '/a/b/1/name', keyword: 'minLength', schemaPath: '', params: {} },
    ],
  } as JsonFormsCore;
  expect(collectionErrorPositions(core, ['a.b'], [0, 1])).toEqual([{ index: 0, count: 1 }]);
  expect(collectionErrorPositions(core, ['a', 'b'], [0, 1])).toEqual([{ index: 1, count: 1 }]);
});

it('does not navigate to a provisional contains candidate before a real invalid item', () => {
  const core = {
    errors: [
      {
        instancePath: '/reviewers/0',
        keyword: 'required',
        params: { missingProperty: 'lead' },
        schemaPath: '#/properties/reviewers/contains/required',
      },
      {
        instancePath: '/reviewers',
        keyword: 'contains',
        params: {},
        schemaPath: '#/properties/reviewers/contains',
      },
      {
        instancePath: '/reviewers/1/name',
        keyword: 'minLength',
        params: { limit: 2 },
        schemaPath: '#/properties/reviewers/items/properties/name/minLength',
      },
    ],
  } as JsonFormsCore;
  expect(collectionErrorPositions(core, 'reviewers', [0, 1])).toEqual([{ index: 1, count: 1 }]);
});

it('retains empty, slash and tilde property keys in collection error positions', () => {
  const core = {
    errors: [
      { instancePath: '/properties/', keyword: 'type', schemaPath: '', params: {} },
      {
        instancePath: '/properties/a~1b~0c/name',
        keyword: 'minLength',
        schemaPath: '',
        params: {},
      },
      { instancePath: '/other/value', keyword: 'type', schemaPath: '', params: {} },
    ],
  } as JsonFormsCore;
  expect(collectionErrorPositions(core, 'properties', ['', 'a/b~c', 'plain'])).toEqual([
    { index: 0, count: 1 },
    { index: 1, count: 1 },
  ]);
});
