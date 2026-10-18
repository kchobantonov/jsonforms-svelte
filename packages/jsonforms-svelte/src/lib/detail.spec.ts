import { describe, expect, it, vi } from 'vitest';
import type { ControlElement, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { findDetailUISchema, resolveEditorDetail } from './detail';

const schema: JsonSchema = { type: 'object', properties: { name: { type: 'string' } } };
const registered: UISchemaElement = { type: 'VerticalLayout', options: { marker: 'registered' } };
const control = (detail?: unknown): ControlElement => ({
  type: 'Control',
  scope: '#/properties/contact',
  options: { detail },
});

describe('editor detail resolution', () => {
  it.each([undefined, 'DEFAULT', 'registered', 'GENERATED', 'custom-mode'])(
    'consults the registry for %s with the original schema scope and data path',
    (detail) => {
      const tester = vi.fn(() => 10);
      expect(
        findDetailUISchema(
          [{ tester, uischema: registered }],
          schema,
          '#/properties/contact',
          'contacts.0',
          undefined,
          control(detail),
          schema,
        ),
      ).toBe(registered);
      expect(tester).toHaveBeenCalledWith(schema, '#/properties/contact', 'contacts.0');
    },
  );

  it.each(['GENERATE', 'generate', 'Generate'])('bypasses a matching registry for %s', (detail) => {
    const tester = vi.fn(() => 10);
    const result = findDetailUISchema(
      [{ tester, uischema: registered }],
      schema,
      '#/properties/contact',
      'contacts.0',
      undefined,
      control(detail),
      schema,
    );
    expect(tester).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).toContain('#/properties/name');
    expect(result).not.toBe(registered);
  });

  it('normalizes a bare elements container without changing relative scopes or the input', () => {
    const detail = { elements: [{ type: 'Control', scope: '#/properties/name' }] };
    const result = findDetailUISchema(
      [],
      schema,
      '#/properties/contact',
      'contact',
      undefined,
      control(detail),
      schema,
    );
    expect(result).toEqual({ ...detail, type: 'VerticalLayout' });
    expect(detail).not.toHaveProperty('type');
  });

  it('keeps explicit layouts and generates when registration is missing', () => {
    expect(findDetailUISchema([], schema, '#', '', undefined, control(registered), schema)).toBe(
      registered,
    );
    expect(
      JSON.stringify(
        findDetailUISchema([], schema, '#', '', undefined, control('REGISTERED'), schema),
      ),
    ).toContain('#/properties/name');
  });

  it('carries GENERATE through a fallback Control without mutating it', () => {
    const fallback: ControlElement = { type: 'Control', scope: '#', options: { label: false } };
    const result = findDetailUISchema(
      [],
      schema,
      '#',
      '',
      () => fallback,
      control('generate'),
      schema,
    );
    expect(result).toEqual({ ...fallback, options: { label: false, detail: 'GENERATE' } });
    expect(fallback.options).toEqual({ label: false });
  });

  it('preserves an existing editor fallback only when detail is absent', () => {
    const registry = [{ tester: () => 10, uischema: registered }];
    const fallback: UISchemaElement = { type: 'Group' };
    expect(resolveEditorDetail(undefined, registry, schema, '#', '', schema, fallback)).toBe(
      fallback,
    );
    expect(resolveEditorDetail('REGISTERED', registry, schema, '#', '', schema, fallback)).toBe(
      registered,
    );
  });
});

it('chooses the highest applicable detail rank and retains referenced field scopes', () => {
  const root: JsonSchema = {
    definitions: { name: { type: 'string', minLength: 2 } },
    properties: {
      contact: { type: 'object', properties: { name: { $ref: '#/definitions/name' } } },
    },
  };
  const contact = root.properties!.contact;
  const low: UISchemaElement = { type: 'VerticalLayout', options: { marker: 'low' } };
  const inline: UISchemaElement = { type: 'Control', scope: '#/properties/name' };
  const registry = [
    { tester: () => 1, uischema: low },
    { tester: () => 20, uischema: registered },
    { tester: () => -1, uischema: inline },
  ];
  const snapshot = structuredClone(root);
  expect(
    findDetailUISchema(
      registry,
      contact,
      '#/properties/contact',
      'rows.0.contact',
      undefined,
      control('DEFAULT'),
      root,
    ),
  ).toBe(registered);
  expect(
    findDetailUISchema(
      registry,
      contact,
      '#/properties/contact',
      'rows.0.contact',
      undefined,
      control(inline),
      root,
    ),
  ).toBe(inline);
  const generated = findDetailUISchema(
    registry,
    contact,
    '#/properties/contact',
    'rows.0.contact',
    undefined,
    control('GENERATE'),
    root,
  );
  expect(JSON.stringify(generated)).toContain('#/properties/name');
  expect(root).toEqual(snapshot);
});
