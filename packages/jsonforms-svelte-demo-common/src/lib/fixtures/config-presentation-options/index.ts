import { createLocalizedExample, type DemoExample } from '../../examples/definitions.js';
import type { UISchemaElement } from '@jsonforms/core';

export const createConfigPresentationOptionExamples = (getLocale: () => string): DemoExample[] => [
  createLocalizedExample(
    {
      name: 'config-group-border',
      label: 'Group local border',
      exampleSource: 'development',
      schema: { type: 'object' },
      uischema: {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Group',
            label: 'Bordered group',
            elements: [{ type: 'Label', text: 'Bordered content' }],
          },
          {
            type: 'Group',
            label: 'Borderless group',
            options: { showBorder: false },
            elements: [{ type: 'Label', text: 'Borderless content' }],
          },
        ],
      } as UISchemaElement,
      data: {},
    },
    { en: {}, bg: {} },
    getLocale,
  ),
  createLocalizedExample(
    {
      name: 'config-image-dimensions',
      label: 'ImageView local dimensions',
      exampleSource: 'development',
      schema: { type: 'object' },
      uischema: {
        type: 'ImageView',
        src: '/preview.png',
        alt: 'Sized preview',
        options: { width: 120, height: '5rem' },
      } as UISchemaElement,
      data: {},
      config: { width: 300, height: 300 },
    },
    { en: {}, bg: {} },
    getLocale,
  ),
  ...([true, false] as const).map((vertical) =>
    createLocalizedExample(
      {
        name: vertical ? 'config-separator-local-vertical' : 'config-separator-removed-vertical',
        label: vertical ? 'Local vertical separator' : 'Removed flat vertical separator',
        exampleSource: 'development',
        schema: { type: 'object' },
        uischema: {
          type: 'Separator',
          options: vertical ? { vertical: true } : undefined,
        } as UISchemaElement,
        data: {},
        config: { vertical: !vertical },
      },
      { en: {}, bg: {} },
      getLocale,
    ),
  ),
  createLocalizedExample(
    {
      name: 'config-label-format',
      label: 'Literal label format',
      exampleSource: 'development',
      schema: { type: 'object' },
      uischema: {
        type: 'Label',
        text: '<strong>Literal</strong>',
        options: { format: 'html' },
      } as UISchemaElement,
      data: {},
    },
    { en: {}, bg: {} },
    getLocale,
  ),
];
