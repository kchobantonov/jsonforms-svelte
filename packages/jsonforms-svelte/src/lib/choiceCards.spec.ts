import { describe, expect, it, vi } from 'vitest';
import type { ControlElement, JsonSchema7 as JsonSchema, UISchemaElement } from '@jsonforms/core';
import { cardDiscriminatorIndex, isCardPresentation, resolveCardChoices } from './choiceCards';

describe('choice-card contracts', () => {
  it('matches reloaded structural values and explicit null without branch editors', () => {
    const control: ControlElement = {
      type: 'Control',
      scope: '#',
      options: {
        choices: [
          { value: { id: 1 }, label: 'Object' },
          { value: null, label: 'Null', detail: 'GENERATE' },
        ],
      },
    };
    const result = resolveCardChoices({ enum: [{ id: 1 }, null] }, control, '', {});
    expect(result.branchMode).toBe(false);
    expect(result.choices.map((choice) => choice.label)).toEqual(['Object', 'Null']);
    expect(result.choices.every((choice) => choice.uischema === undefined)).toBe(true);
  });

  it('treats oneOf constants as value choices', () => {
    const result = resolveCardChoices(
      { oneOf: [{ const: false }, { const: 0 }, { const: '' }] },
      { type: 'Control', scope: '#' },
      '',
      {},
    );
    expect(result.values).toEqual([false, 0, '']);
    expect(result.branchMode).toBe(false);
  });

  it('resolves branch references and per-card modes with the original paths', () => {
    const email: JsonSchema = {
      type: 'object',
      title: 'Email',
      properties: { address: { type: 'string' } },
    };
    const root: JsonSchema = { definitions: { email } };
    const schema: JsonSchema = { oneOf: [{ $ref: '#/definitions/email' }] };
    const registered: UISchemaElement = {
      type: 'Control',
      scope: '#/properties/address',
      label: 'Registered',
    };
    const tester = vi.fn(() => 10);
    const control: ControlElement = {
      type: 'Control',
      scope: '#/properties/contact',
      options: { choices: [{ branch: 0, detail: 'REGISTERED' }] },
    };
    const result = resolveCardChoices(schema, control, 'rows.0.contact', root, [
      { tester, uischema: registered },
    ]);
    expect(result.choices[0].schema).toEqual(email);
    expect(result.choices[0].uischema).toBe(registered);
    expect(tester).toHaveBeenCalledWith(email, control.scope, 'rows.0.contact');
    tester.mockClear();
    const generated = resolveCardChoices(
      schema,
      { ...control, options: { choices: [{ branch: 0, detail: 'generate' }] } },
      'rows.0.contact',
      root,
      [{ tester, uischema: registered }],
    );
    expect(tester).not.toHaveBeenCalled();
    expect(generated.choices[0].uischema).not.toBe(registered);
    expect(JSON.stringify(generated.choices[0].uischema)).toContain('#/properties/address');
  });

  it('allows only presentation nodes in selectable card labels', () => {
    expect(
      isCardPresentation({
        type: 'HorizontalLayout',
        elements: [{ type: 'Label' }, { type: 'ImageView' }],
      }),
    ).toBe(true);
    for (const type of ['Control', 'Button', 'Template', 'Group']) {
      expect(isCardPresentation({ type: 'VerticalLayout', elements: [{ type }] })).toBe(false);
    }
    expect(isCardPresentation(null)).toBe(false);
  });
});

it('identifies incomplete discriminated branches only from required distinct primitive constants', () => {
  const branches: JsonSchema[] = ['email', 'post'].map((value) => ({
    type: 'object',
    required: ['kind'],
    properties: { kind: { const: value } },
  }));
  expect(cardDiscriminatorIndex(branches, { kind: 'post' })).toBe(1);
  expect(cardDiscriminatorIndex(branches, { kind: 'email', address: '' })).toBe(0);
  expect(cardDiscriminatorIndex(branches, { kind: 'unknown' })).toBe(-1);
  expect(
    cardDiscriminatorIndex(
      branches.map((branch) => ({ ...branch, required: [] })),
      { kind: 'post' },
    ),
  ).toBe(-1);
});
