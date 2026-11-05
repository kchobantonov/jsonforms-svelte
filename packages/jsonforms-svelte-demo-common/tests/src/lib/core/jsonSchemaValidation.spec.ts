import { describe, expect, it, vi } from 'vite-plus/test';
import Ajv from 'ajv';
import type { LabelElement } from '@jsonforms/core';
import type { MonacoApi } from '../../../../src/lib/core/monaco';
vi.mock('../../../../src/lib/core/monaco', () => ({ default: {} }));
import { configureDataValidation } from '../../../../src/lib/core/jsonSchemaValidation';
import { ruleSchema, uiSchema } from '../../../../src/lib/core/jsonschema';
import presentationUiSchema from '@chobantonov/jsonforms-extended-spec/examples/presentation/uischema.json';
import monacoEditorUiSchema from '../../../../src/lib/examples/monaco-editor/uischema.json';

it('accepts string translation keys on supported UI elements in the Monaco schema', () => {
  const validator = new Ajv({ strict: false });
  validator.addSchema(ruleSchema.schema);
  const validate = validator.compile(uiSchema.schema);
  const typedLabel = { type: 'Label', i18n: 'seats', text: 'Seats' } satisfies LabelElement;
  const elements = [
    typedLabel,
    { type: 'Control', scope: '#/properties/seats' },
    { type: 'HorizontalLayout', elements: [] },
    { type: 'VerticalLayout', elements: [] },
    { type: 'Categorization', elements: [{ type: 'Category', label: 'Tab', elements: [] }] },
    { type: 'Group', label: 'Group', elements: [] },
    { type: 'ListWithDetail', scope: '#/properties/items' },
    { type: 'Button', label: 'Save' },
  ];
  for (const element of elements) {
    expect(validate({ ...element, i18n: 'example.key' }), element.type).toBe(true);
    expect(validate({ ...element, i18n: 42 }), element.type).toBe(false);
  }
  expect(
    validate({
      type: 'Categorization',
      elements: [{ type: 'Category', label: 'Tab', i18n: 'tab', elements: [] }],
    }),
  ).toBe(true);
  expect(
    validate({
      type: 'Categorization',
      elements: [{ type: 'Category', label: 'Tab', i18n: 42, elements: [] }],
    }),
  ).toBe(false);
  expect(validate({ type: 'Control', scope: '#/properties/name', label: false })).toBe(true);
  expect(
    validate({ type: 'Control', scope: '#/properties/name', label: { text: 'Name', show: true } }),
  ).toBe(true);
  expect(validate({ type: 'Control', scope: '#/properties/name', label: { show: 'yes' } })).toBe(
    false,
  );
});

it('accepts presentation elements and split variants of standard layouts', () => {
  const validator = new Ajv({ strict: false });
  validator.addSchema(ruleSchema.schema);
  const validate = validator.compile(uiSchema.schema);

  expect(validate(presentationUiSchema), JSON.stringify(validate.errors)).toBe(true);
  expect(validate(monacoEditorUiSchema), JSON.stringify(validate.errors)).toBe(true);
  expect(
    validate({
      type: 'VerticalLayout',
      elements: [],
      options: { variant: 'splitter' },
    }),
  ).toBe(true);
  expect(validate({ type: 'SplitLayout', elements: [] })).toBe(false);

  expect(validate({ type: 'ImageView', src: 42 })).toBe(false);
  expect(validate({ type: 'Link', target: 'invalid' })).toBe(false);
  expect(validate({ type: 'Spacer', size: false })).toBe(false);
});

it('accepts the bundled demo UI schemas', () => {
  const validator = new Ajv({ strict: false });
  validator.addSchema(ruleSchema.schema);
  const validate = validator.compile(uiSchema.schema);
  const examples = import.meta.glob('../../../../src/lib/examples/**/uischema.json', {
    eager: true,
    import: 'default',
  });

  const failures = Object.entries(examples)
    .filter(([, schema]) => !validate(schema))
    .map(([path]) => path);
  expect(failures).toEqual([]);
});

describe('data editor schema associations', () => {
  it('removes a cleared authored schema without disturbing unrelated editors or diagnostics settings', () => {
    let options = {
      validate: true,
      allowComments: false,
      schemas: [
        {
          uri: 'current.schema.json',
          fileMatch: ['current.data.json'],
          schema: { type: 'string' },
        },
        { uri: 'current.schema.json', fileMatch: ['other.data.json'], schema: { type: 'number' } },
        { uri: 'other.schema.json', fileMatch: ['third.data.json'], schema: {} },
      ],
    };
    const setDiagnosticsOptions = vi.fn((next) => {
      options = next;
    });
    const editor = {
      json: {
        jsonDefaults: {
          get diagnosticsOptions() {
            return options;
          },
          setDiagnosticsOptions,
        },
      },
    } as unknown as MonacoApi;
    configureDataValidation(editor, 'current.schema.json', 'current.data.json', undefined);
    expect(options.schemas.map((entry) => entry.fileMatch)).toEqual([
      ['other.data.json'],
      ['third.data.json'],
    ]);
    expect(options.validate).toBe(true);
    expect(options.allowComments).toBe(false);
    configureDataValidation(editor, 'current.schema.json', 'current.data.json', {});
    expect(
      options.schemas.find((entry) => entry.fileMatch[0] === 'current.data.json')?.schema,
    ).toEqual({});
    configureDataValidation(editor, 'current.schema.json', 'current.data.json', false);
    expect(
      options.schemas.find((entry) => entry.fileMatch[0] === 'current.data.json')?.schema,
    ).toBe(false);
    configureDataValidation(editor, 'current.schema.json', 'current.data.json', true);
    expect(
      options.schemas.find((entry) => entry.fileMatch[0] === 'current.data.json')?.schema,
    ).toBe(true);
    expect(setDiagnosticsOptions).toHaveBeenCalledTimes(4);
  });
});
