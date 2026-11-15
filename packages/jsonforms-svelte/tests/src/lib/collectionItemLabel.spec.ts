import type { JsonSchema } from '@jsonforms/core';
import { expect, it } from 'vite-plus/test';
import {
  collectionItemChoiceLabel,
  collectionItemDefaultLabelPath,
} from '../../../src/lib/collectionItemLabel';

it('finds the first primitive field in a referenced item and ignores unresolved references', () => {
  const root = {
    type: 'object',
    $defs: {
      Item: {
        type: 'object',
        properties: { contact: { type: 'object' }, department: { $ref: '#/$defs/Department' } },
      },
      Department: { type: 'string' },
    },
  } as JsonSchema;
  expect(collectionItemDefaultLabelPath({ $ref: '#/$defs/Item' }, root)).toBe('department');
  expect(collectionItemDefaultLabelPath({ $ref: '#/$defs/Missing' }, root)).toBeUndefined();
});
import { createCatalogTranslator } from '../../../src/lib/catalogTranslator';

it('uses and translates a selected oneOf title while leaving unknown values alone', () => {
  const schema = {
    type: 'object',
    properties: {
      department: {
        type: 'string',
        oneOf: [{ const: 'eng', title: 'Engineering' }],
      },
    },
  } as JsonSchema;
  const translate = createCatalogTranslator('bg', {
    bg: { 'employees.department.Engineering': 'Инженерство' },
  });
  expect(
    collectionItemChoiceLabel(
      schema,
      'department',
      'eng',
      schema,
      translate,
      'employees.0.department',
    ),
  ).toBe('Инженерство');
  expect(
    collectionItemChoiceLabel(
      schema,
      'department',
      'unknown',
      schema,
      translate,
      'employees.0.department',
    ),
  ).toBeUndefined();
});

it('resolves a dotted property path and translates an enum choice through its field key', () => {
  const schema = {
    type: 'object',
    properties: {
      contact: { type: 'object', properties: { code: { type: 'string', enum: ['a'] } } },
    },
  } as JsonSchema;
  expect(
    collectionItemChoiceLabel(
      schema,
      'contact.code',
      'a',
      schema,
      createCatalogTranslator('bg', { bg: { 'employees.contact.code.a': 'А' } }),
      'employees.0.contact.code',
    ),
  ).toBe('А');
});

it('resolves a selected property schema through a root reference', () => {
  const item = {
    type: 'object',
    properties: { department: { $ref: '#/$defs/Department' } },
  } as JsonSchema;
  const root = {
    type: 'object',
    $defs: {
      Department: { type: 'string', oneOf: [{ const: 'eng', title: 'Engineering' }] },
    },
  } as JsonSchema;
  expect(
    collectionItemChoiceLabel(item, 'department', 'eng', root, undefined, 'items.0.department'),
  ).toBe('Engineering');
});

it('keeps zero and false as meaningful choice values', () => {
  const item = {
    type: 'object',
    properties: {
      count: { type: 'number', oneOf: [{ const: 0, title: 'Zero' }] },
      active: { type: 'boolean', oneOf: [{ const: false, title: 'Disabled' }] },
    },
  } as JsonSchema;
  expect(collectionItemChoiceLabel(item, 'count', 0, item, undefined, 'items.0.count')).toBe(
    'Zero',
  );
  expect(collectionItemChoiceLabel(item, 'active', false, item, undefined, 'items.0.active')).toBe(
    'Disabled',
  );
});

it('resolves only an own prototype-looking item property', () => {
  const item = JSON.parse(
    '{"type":"object","properties":{"constructor":{"type":"string","oneOf":[{"const":"own","title":"Own choice"}]}}}',
  ) as JsonSchema;
  expect(
    collectionItemChoiceLabel(item, 'constructor', 'own', item, undefined, 'items.0.constructor'),
  ).toBe('Own choice');
  expect(
    collectionItemChoiceLabel(
      { type: 'object' },
      'constructor',
      'own',
      item,
      undefined,
      'items.0.constructor',
    ),
  ).toBeUndefined();
});
