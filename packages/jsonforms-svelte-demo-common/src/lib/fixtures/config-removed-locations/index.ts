import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';

export const createConfigRemovedLocationExamples = (getLocale: () => string): DemoExample[] => [
  createLocalizedExample(
    {
      name: 'config-removed-file-accept',
      label: 'Removed nested file accept',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: { file: { type: 'string', format: 'byte', contentMediaType: 'image/png' } },
      } as JsonSchema,
      uischema: { type: 'Control', scope: '#/properties/file' },
      data: {},
      config: { jsonformsExtended: { accept: 'text/plain' } },
    },
    { en: { 'file.label': 'File' }, bg: { 'file.label': 'Файл' } },
    getLocale,
  ),
  createLocalizedExample(
    {
      name: 'config-removed-category-initial',
      label: 'Removed nested category initial',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: { first: { type: 'string' }, second: { type: 'string' } },
      },
      uischema: {
        type: 'Categorization',
        elements: [
          {
            type: 'Category',
            name: 'first',
            label: 'First',
            elements: [{ type: 'Control', scope: '#/properties/first' }],
          },
          {
            type: 'Category',
            name: 'second',
            label: 'Second',
            elements: [{ type: 'Control', scope: '#/properties/second' }],
          },
        ],
      } as UISchemaElement,
      data: { first: 'One', second: 'Two' },
      config: { jsonformsExtended: { initial: 'second' } },
    },
    {
      en: { 'first.label': 'First', 'second.label': 'Second' },
      bg: { 'first.label': 'Първи', 'second.label': 'Втори' },
    },
    getLocale,
  ),
  createLocalizedExample(
    {
      name: 'config-removed-table',
      label: 'Removed nested table selection',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: {
          records: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
      },
      uischema: { type: 'Control', scope: '#/properties/records' },
      data: { records: [{ name: 'Ada' }] },
      config: { jsonformsExtended: { table: true } },
    },
    { en: { 'records.label': 'Records' }, bg: { 'records.label': 'Записи' } },
    getLocale,
  ),
  createLocalizedExample(
    {
      name: 'config-removed-cells',
      label: 'Removed nested cell descriptors',
      exampleSource: 'development',
      schema: {
        type: 'object',
        properties: {
          records: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                address: {
                  type: 'object',
                  properties: { street: { type: 'string' } },
                },
              },
            },
          },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#/properties/records',
        options: {
          table: true,
          cells: { address: { summary: { type: 'Control', scope: '#/properties/street' } } },
        },
      } as UISchemaElement,
      data: { records: [{ address: { street: 'Main Street' } }] },
      config: {
        jsonformsExtended: {
          cells: { address: { summary: { type: 'Label', text: 'Legacy' } } },
        },
      },
    },
    { en: { 'records.label': 'Records' }, bg: { 'records.label': 'Записи' } },
    getLocale,
  ),
  ...([true, false] as const).map((vertical) =>
    createLocalizedExample(
      {
        name: vertical
          ? 'config-categorization-local-vertical'
          : 'config-categorization-removed-vertical',
        label: vertical ? 'Local vertical categories' : 'Removed flat vertical categories',
        exampleSource: 'development',
        schema: {
          type: 'object',
          properties: { first: { type: 'string' }, second: { type: 'string' } },
        },
        uischema: {
          type: 'Categorization',
          options: vertical ? { vertical: true } : undefined,
          elements: [
            {
              type: 'Category',
              label: 'First',
              elements: [{ type: 'Control', scope: '#/properties/first' }],
            },
            {
              type: 'Category',
              label: 'Second',
              elements: [{ type: 'Control', scope: '#/properties/second' }],
            },
          ],
        } as UISchemaElement,
        data: { first: 'One', second: 'Two' },
        config: { vertical: !vertical },
      },
      {
        en: { 'first.label': 'First', 'second.label': 'Second' },
        bg: { 'first.label': 'Първи', 'second.label': 'Втори' },
      },
      getLocale,
    ),
  ),
];
