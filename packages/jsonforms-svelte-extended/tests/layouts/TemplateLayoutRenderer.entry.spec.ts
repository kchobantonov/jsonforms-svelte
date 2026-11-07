import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { describe, expect, it } from 'vite-plus/test';
import {
  extendedSharedLayoutRenderers,
  markupLabelRendererEntry,
  nativeTemplateLayoutRendererEntry,
  slotRendererEntry,
  templateLayoutRendererEntry,
  templateRendererEntry,
} from '../../src/lib/layouts';

const schema: JsonSchema = {
  type: 'object',
  properties: {
    value: { type: 'string' },
  },
};

const createLayout = (lang?: string): UISchemaElement =>
  ({
    type: 'TemplateLayout',
    ...(lang ? { lang } : {}),
    template: '<div>{{>field}}</div>',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/value',
        name: 'field',
      },
    ],
  }) as unknown as UISchemaElement;

describe('TemplateLayoutRenderer entry', () => {
  it('matches ractive template layouts', () => {
    expect(
      templateLayoutRendererEntry.tester(createLayout('ractive'), schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(2);
  });

  it('matches JSX template layouts without loading the compiler', () => {
    expect(
      templateLayoutRendererEntry.tester(createLayout('jsx'), schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(2);
  });

  it('uses the configured default template language when lang is omitted', () => {
    expect(
      templateLayoutRendererEntry.tester(createLayout(), schema, {
        rootSchema: schema,
        config: { jsonformsExtended: { defaultTemplateLang: 'ractive' } },
      }),
    ).toBe(2);
    expect(
      templateLayoutRendererEntry.tester(createLayout(), schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(2);
  });

  it('ranks unsupported template languages below registered engines for diagnostics', () => {
    expect(
      templateLayoutRendererEntry.tester(createLayout('vue'), schema, {
        rootSchema: schema,
        config: {},
      }),
    ).toBe(1);
    expect(
      templateLayoutRendererEntry.tester(createLayout(), schema, {
        rootSchema: schema,
        config: { jsonformsExtended: { defaultTemplateLang: 'liquid' } },
      }),
    ).toBe(1);
  });

  it('exports the shared template layout renderer entry', () => {
    expect(extendedSharedLayoutRenderers).toEqual([
      markupLabelRendererEntry,
      nativeTemplateLayoutRendererEntry,
      templateLayoutRendererEntry,
      templateRendererEntry,
      slotRendererEntry,
    ]);
  });
});

it('uses the namespaced template language option', () => {
  expect(
    templateLayoutRendererEntry.tester(createLayout(), schema, {
      rootSchema: schema,
      config: {
        jsonformsExtended: { defaultTemplateLang: 'unsupported' },
      },
    }),
  ).toBe(1);
  expect(
    templateLayoutRendererEntry.tester(createLayout('ractive'), schema, {
      rootSchema: schema,
      config: { jsonformsExtended: { defaultTemplateLang: 'unsupported' } },
    }),
  ).toBe(2);
});
