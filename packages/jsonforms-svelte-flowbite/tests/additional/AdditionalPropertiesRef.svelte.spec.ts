import { clearAllIds, createAjv, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { flowbiteRenderers } from '../../src/lib';
import { mountForm } from '../testUtils';

describe('AdditionalProperties nested $ref propertyNames', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  it('mounts a map whose key schema references the root $defs', () => {
    const schema = {
      type: 'object',
      $defs: {
        attrName: {
          type: 'string',
          pattern: '^[A-Za-z_][A-Za-z0-9_]*$',
        },
      },
      properties: {
        secretFiles: {
          type: 'object',
          additionalProperties: { type: 'string' },
          propertyNames: { $ref: '#/$defs/attrName' },
        },
      },
    } as unknown as JsonSchema;
    const uischema = { type: 'Control', scope: '#' } as UISchemaElement;

    expect(() =>
      mountForm({
        data: { secretFiles: {} },
        schema,
        uischema,
        renderers: flowbiteRenderers,
      }),
    ).not.toThrow();
  });

  it('reuses the parent AJV configuration in the nested property-name form', () => {
    const schema = {
      type: 'object',
      properties: {
        secretFiles: {
          type: 'object',
          additionalProperties: { type: 'string' },
          propertyNames: {
            pattern: '^"([^"$\\\\]|\\$(?!{)|\\\\.)*"$',
          },
        },
      },
    } as unknown as JsonSchema;
    const uischema = { type: 'Control', scope: '#' } as UISchemaElement;
    const ajv = createAjv({ unicodeRegExp: false });

    expect(() =>
      mountForm({
        data: { secretFiles: {} },
        schema,
        uischema,
        renderers: flowbiteRenderers,
        ajv,
      }),
    ).not.toThrow();
  });
});
