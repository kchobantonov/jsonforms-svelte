import type { JsonSchema } from '@jsonforms/core';
import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';

const branch = {
  if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
  then: { properties: { vat: { type: 'string' } } },
  else: { properties: { nickname: { type: 'string' } } },
};
const extra = { properties: { reference: { type: 'string' } } };
const profile = {
  type: 'object',
  properties: { kind: { type: 'string' } },
  allOf: [{ $ref: '#/definitions/Branch' }, { $ref: '#/definitions/Extra' }],
};

export const createConditionalReferenceExamples = (getLocale: () => string): DemoExample[] =>
  [false, true].map((external) =>
    createLocalizedExample(
      {
        name: external ? 'conditional-supplied-reference' : 'conditional-local-reference',
        label: external ? 'Conditional host-supplied reference' : 'Conditional local reference',
        exampleSource: 'development',
        schema: {
          ...(external && { $id: 'https://example.test/root.json' }),
          type: 'object',
          ...(!external && { definitions: { Branch: branch, Extra: extra, Profile: profile } }),
          properties: {
            value: {
              $ref: external
                ? 'https://example.test/common.json#/definitions/Profile'
                : '#/definitions/Profile',
            },
          },
        } as JsonSchema,
        ...(external && {
          externalSchemas: [
            {
              $id: 'https://example.test/common.json',
              definitions: { Branch: branch, Extra: extra, Profile: profile },
            },
          ],
        }),
        uischema: {
          type: 'Control',
          scope: '#/properties/value',
          options: { conditionalFields: true },
        },
        data: { value: { kind: 'business', vat: 'BG123', nickname: 'kept', reference: 'REF-1' } },
      },
      {
        en: {
          'value.label': 'Profile',
          'kind.label': 'Kind',
          'vat.label': 'VAT',
          'nickname.label': 'Nickname',
          'reference.label': 'Reference',
        },
        bg: {
          'value.label': 'Профил',
          'kind.label': 'Вид',
          'vat.label': 'ДДС',
          'nickname.label': 'Прякор',
          'reference.label': 'Препратка',
        },
      },
      getLocale,
    ),
  );

export const createRecursiveConditionalReferenceExample = (getLocale: () => string): DemoExample =>
  createLocalizedExample(
    {
      name: 'conditional-recursive-reference',
      label: 'Recursive conditional reference',
      exampleSource: 'development',
      schema: {
        $id: 'https://example.test/root.json',
        type: 'object',
        definitions: {
          Branch: branch,
          Node: {
            type: 'object',
            properties: { kind: { type: 'string' }, child: { $ref: '#/definitions/Node' } },
            allOf: [{ $ref: '#/definitions/Branch' }],
          },
        },
        properties: { value: { $ref: '#/definitions/Node' } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/value' },
      config: { jsonformsExtended: { conditionalFields: true } },
      data: {
        value: {
          kind: 'business',
          vat: 'Parent VAT',
          nickname: 'parent hidden',
          child: { kind: 'personal', nickname: 'Child nick', vat: 'child hidden' },
        },
      },
    },
    {
      en: {
        'value.label': 'Node',
        'kind.label': 'Kind',
        'vat.label': 'VAT',
        'nickname.label': 'Nickname',
      },
      bg: {
        'value.label': 'Възел',
        'kind.label': 'Вид',
        'vat.label': 'ДДС',
        'nickname.label': 'Прякор',
      },
    },
    getLocale,
  );
