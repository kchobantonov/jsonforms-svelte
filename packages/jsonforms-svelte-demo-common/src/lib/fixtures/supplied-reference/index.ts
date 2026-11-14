import type { JsonSchema } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

type ReferenceProfile = 'identified' | 'anonymous' | 'nested';

const createExample = (getLocale: () => string, profile: ReferenceProfile): DemoExample =>
  createLocalizedExample(
    {
      name: profile === 'identified' ? 'supplied-reference' : `${profile}-supplied-reference`,
      label:
        profile === 'anonymous'
          ? 'Anonymous root with host-supplied reference'
          : profile === 'nested'
            ? 'Nested host-supplied schema resource'
            : 'Host-supplied schema reference',
      exampleSource: 'development',
      schema: {
        ...(profile !== 'anonymous' && { $id: 'https://example.test/root.json' }),
        type: 'object',
        properties: {
          profile: {
            $ref:
              profile === 'nested'
                ? 'https://example.test/profile.json'
                : 'https://example.test/common.json#/definitions/Profile',
          },
        },
      } as JsonSchema,
      externalSchemas: [
        {
          $id: 'https://example.test/common.json',
          definitions: {
            Name: { type: 'string', minLength: 2 },
            ...(profile !== 'nested' && {
              Profile: {
                type: 'object',
                properties: { name: { $ref: '#/definitions/Name' } },
              },
            }),
          },
          ...(profile === 'nested' && {
            $defs: {
              Profile: {
                $id: 'profile.json',
                type: 'object',
                properties: {
                  name: { $ref: 'https://example.test/common.json#/definitions/Name' },
                },
              },
            },
          }),
        } as JsonSchema,
      ],
      uischema: { type: 'Control', scope: '#/properties/profile' },
      data: { profile: { name: 'Ada' } },
    },
    {
      en: { 'profile.label': 'Profile', 'name.label': 'Name' },
      bg: { 'profile.label': 'Профил', 'name.label': 'Име' },
    },
    getLocale,
  );

export const createSuppliedReferenceExample = (getLocale: () => string): DemoExample =>
  createExample(getLocale, 'identified');

export const createAnonymousSuppliedReferenceExample = (getLocale: () => string): DemoExample =>
  createExample(getLocale, 'anonymous');

export const createNestedSuppliedReferenceExample = (getLocale: () => string): DemoExample =>
  createExample(getLocale, 'nested');
