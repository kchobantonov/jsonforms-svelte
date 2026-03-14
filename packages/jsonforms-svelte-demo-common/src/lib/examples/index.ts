import type { JsonFormsI18nState, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { getExamples, type ExampleDescription } from '@jsonforms/examples';
import { createTranslator } from '../i18n/i18n';

import combinatorPropertiesData from './combinator-properties/data.json' with { type: 'json' };
import combinatorPropertiesSchema from './combinator-properties/schema.json' with { type: 'json' };
import combinatorPropertiesUiSchema from './combinator-properties/uischema.json' with { type: 'json' };

import durationData from './duration/data.json' with { type: 'json' };
import durationSchema from './duration/schema.json' with { type: 'json' };
import durationUiSchema from './duration/uischema.json' with { type: 'json' };

import extendedControlOptionsData from './extended-control-options/data.json' with { type: 'json' };
import extendedControlOptionsSchema from './extended-control-options/schema.json' with { type: 'json' };
import extendedControlOptionsFlowbiteUiSchema from './extended-control-options/uischema.flowbite.json' with { type: 'json' };
import extendedControlOptionsSkeletonUiSchema from './extended-control-options/uischema.skeleton.json' with { type: 'json' };

import fileData from './file/data.json' with { type: 'json' };
import fileI18n from './file/i18n.json' with { type: 'json' };
import fileSchema from './file/schema.json' with { type: 'json' };
import fileUiSchema from './file/uischema.json' with { type: 'json' };

import mainData from './main/data.json' with { type: 'json' };
import mainI18n from './main/i18n.json' with { type: 'json' };
import mainSchema from './main/schema.json' with { type: 'json' };
import mainUiSchema from './main/uischema.json' with { type: 'json' };

import splitLayoutData from './split-layout/data.json' with { type: 'json' };
import splitLayoutSchema from './split-layout/schema.json' with { type: 'json' };
import splitLayoutUiSchema from './split-layout/uischema.json' with { type: 'json' };

export type DemoExamplesVariant = 'skeleton' | 'flowbite';

export type DemoExample = ExampleDescription & {
  i18n?: JsonFormsI18nState & { translations?: Record<string, unknown> };
};

const createStaticExample = (
  example: Omit<DemoExample, 'uischema' | 'schema'> & {
    schema: JsonSchema;
    uischema: UISchemaElement;
  },
): DemoExample => example;

const createLocalizedExample = (
  example: Omit<DemoExample, 'i18n' | 'uischema' | 'schema'> & {
    schema: JsonSchema;
    uischema: UISchemaElement;
  },
  translations: Record<string, unknown>,
  getLocale: () => string,
): DemoExample => ({
  ...example,
  get i18n() {
    const locale = getLocale();
    return {
      locale,
      translate: createTranslator(locale, translations),
      translations,
    };
  },
});

export const createDemoExamples = (
  variant: DemoExamplesVariant,
  getLocale: () => string,
): DemoExample[] => {
  const extendedControlOptionsUiSchema =
    variant === 'flowbite'
      ? (extendedControlOptionsFlowbiteUiSchema as UISchemaElement)
      : (extendedControlOptionsSkeletonUiSchema as UISchemaElement);

  const customExamples: DemoExample[] = [
    createStaticExample({
      name: 'combinator-properties',
      label: 'Combinator Properties',
      data: combinatorPropertiesData,
      schema: combinatorPropertiesSchema as unknown as JsonSchema,
      uischema: combinatorPropertiesUiSchema as UISchemaElement,
    }),
    createStaticExample({
      name: 'duration',
      label: 'Duration',
      data: durationData,
      schema: durationSchema as JsonSchema,
      uischema: durationUiSchema as UISchemaElement,
    }),
    createStaticExample({
      name: 'extended-control-options',
      label: 'Extended Control Options',
      data: extendedControlOptionsData,
      schema: extendedControlOptionsSchema as JsonSchema,
      uischema: extendedControlOptionsUiSchema,
    }),
    createStaticExample({
      name: 'split-layout',
      label: 'Split Layout',
      data: splitLayoutData,
      schema: splitLayoutSchema as JsonSchema,
      uischema: splitLayoutUiSchema as UISchemaElement,
    }),
    createLocalizedExample(
      {
        name: 'file',
        label: 'File',
        data: fileData,
        schema: fileSchema as JsonSchema,
        uischema: fileUiSchema as UISchemaElement,
      },
      fileI18n as Record<string, unknown>,
      getLocale,
    ),
    createLocalizedExample(
      {
        name: 'main',
        label: 'Main',
        data: mainData,
        schema: mainSchema as JsonSchema,
        uischema: mainUiSchema as UISchemaElement,
      },
      mainI18n as Record<string, unknown>,
      getLocale,
    ),
  ];

  const builtinExamples = getExamples() as DemoExample[];
  const mergedExamples = [...builtinExamples, ...customExamples];
  const uniqueByName = new Map(mergedExamples.map((example) => [example.name, example]));

  return Array.from(uniqueByName.values()).sort((a, b) => a.label.localeCompare(b.label));
};

export const createSkeletonDemoExamples = (getLocale: () => string): DemoExample[] =>
  createDemoExamples('skeleton', getLocale);

export const createFlowbiteDemoExamples = (getLocale: () => string): DemoExample[] =>
  createDemoExamples('flowbite', getLocale);
