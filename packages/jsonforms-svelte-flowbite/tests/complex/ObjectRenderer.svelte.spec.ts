import { clearAllIds, createAjv, RuleEffect, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as mixedRendererEntry } from '../../src/lib/complex/MixedRenderer.entry';
import { entry as objectRendererEntry } from '../../src/lib/complex/ObjectRenderer.entry';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as groupRendererEntry } from '../../src/lib/layouts/GroupRenderer.entry';
import { entry as layoutRendererEntry } from '../../src/lib/layouts/LayoutRenderer.entry';
import {
  expectValidationError,
  getBySelector,
  mountControl,
  mountForm,
  waitForChange,
} from '../testUtils';

describe('ObjectRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await cleanup();
  });

  const renderers = [
    mixedRendererEntry,
    objectRendererEntry,
    groupRendererEntry,
    layoutRendererEntry,
    stringControlRendererEntry,
  ];

  const propertySchema: JsonSchema = {
    type: 'object',
    title: 'Profile',
    properties: {
      name: {
        type: 'string',
        title: 'Name',
        minLength: 3,
      },
    },
    required: ['name'],
  };

  it.each(['Custom name', 'Име по избор'])(
    'uses a typed detail layout labelled %s at the nested value',
    async (label) => {
      const { view, onchange } = await mountControl({
        renderers,
        propertySchema,
        value: { name: 'Ada', untouched: 'keep' },
        options: {
          detail: {
            type: 'VerticalLayout',
            elements: [{ type: 'Control', scope: '#/properties/name', label }],
          },
        },
      });
      expect(view.container.textContent).toContain(label);
      const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
      expect(input.value).toBe('Ada');
      const before = onchange.mock.calls.length;
      input.value = 'Grace';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const change = await waitForChange(onchange, before);
      expect(change.data.value).toEqual({ name: 'Grace', untouched: 'keep' });
    },
  );

  it.each(['outer.key', '', 'a~b~c'])(
    'evaluates a child rule inside literal %j parent, not its nested lookalike',
    async (parentKey) => {
      const scope = `#/properties/${parentKey.replaceAll('~', '~0').replaceAll('/', '~1')}`;
      const uischema = {
        type: 'Control',
        scope,
        options: {
          detail: {
            type: 'VerticalLayout',
            elements: [
              {
                type: 'Control',
                scope: '#/properties/name',
                rule: {
                  effect: RuleEffect.SHOW,
                  condition: { scope: '#/properties/show', schema: { const: true } },
                },
              },
            ],
          },
        },
      } as const;
      const dataFor = (show: boolean, decoyShow: boolean) => ({
        [parentKey]: { name: 'Literal', show },
        outer: { key: { show: decoyShow } },
      });
      const { view } = await mountForm({
        renderers,
        schema: {
          type: 'object',
          properties: {
            [parentKey]: {
              type: 'object',
              properties: { name: { type: 'string' }, show: { type: 'boolean' } },
            },
            outer: {
              type: 'object',
              properties: { key: { type: 'object', properties: { show: { type: 'boolean' } } } },
            },
          },
        },
        uischema,
        data: dataFor(true, false),
      });
      const names = () =>
        [...view.container.querySelectorAll<HTMLInputElement>('input')].map((input) => input.value);
      await vi.waitFor(() => expect(names()).toContain('Literal'));
      await view.rerender({ data: dataFor(false, true) });
      await vi.waitFor(() => expect(names()).not.toContain('Literal'));
    },
  );

  it('keeps data and validation indicators inside a literal dotted parent', async () => {
    const { view } = await mountForm({
      renderers,
      schema: {
        type: 'object',
        properties: {
          'outer.key': {
            type: 'object',
            properties: { name: { type: 'string', minLength: 2 } },
          },
          outer: {
            type: 'object',
            properties: {
              key: { type: 'object', properties: { name: { type: 'string', minLength: 2 } } },
            },
          },
        },
      },
      uischema: {
        type: 'Control',
        scope: '#/properties/outer.key',
        options: {
          detail: {
            type: 'Group',
            label: 'Inner',
            options: {
              showDataIndicator: true,
              showValidationIndicator: true,
              showValidationIndicatorCount: true,
            },
            elements: [{ type: 'Control', scope: '#/properties/name' }],
          },
        },
      },
      data: { 'outer.key': { name: 'X' }, outer: { key: { name: 'Good' } } },
    });
    const group = () => view.container.querySelector<HTMLElement>('[data-group-frame]');
    await vi.waitFor(() => expect(group()?.querySelector('[data-group-indicator]')).not.toBeNull());
    await vi.waitFor(() =>
      expect(
        group()
          ?.querySelector('[data-container-validation-indicator]')
          ?.getAttribute('data-error-count'),
      ).toBe('1'),
    );
    await view.rerender({
      data: { 'outer.key': { name: 'Good' }, outer: { key: { name: 'X' } } },
    });
    await vi.waitFor(() =>
      expect(group()?.querySelector('[data-container-validation-indicator]')).toBeNull(),
    );
    expect(group()?.querySelector('[data-group-indicator]')).not.toBeNull();
  });

  it('renders nested object control when no data is provided', async () => {
    const { view } = await mountControl({ renderers, propertySchema });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('');
  });

  it('updates core data from nested input change', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema,
      value: { name: 'Ada' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('Ada');

    const before = onchange.mock.calls.length;
    input.value = 'Grace';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    const value = changeEvent.data.value as { name: string };
    expect(value.name).toBe('Grace');
  });

  it('renders validation error for invalid nested data', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema,
      value: { name: 'Al' },
    });

    expectValidationError(view.container);
  });

  it('renames a dynamic property while preserving its value', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
      value: { nickname: 'Ada' },
    });

    const renameButton = getBySelector<HTMLButtonElement>(
      view.container,
      'button[aria-label^="Rename "]',
    );
    renameButton.click();

    await vi.waitFor(() => {
      expect(document.querySelector('input[id$="-rename-property"]')).toBeTruthy();
    });
    const renameInput = document.querySelector<HTMLInputElement>('input[id$="-rename-property"]')!;
    renameInput.value = 'displayName';
    renameInput.dispatchEvent(new Event('input', { bubbles: true }));

    const before = onchange.mock.calls.length;
    document.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toEqual({ displayName: 'Ada' });
  });

  it('enforces schema name constraints when renaming a dynamic property', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: {
        type: 'object',
        propertyNames: { pattern: '^[a-zA-Z]+$' },
        additionalProperties: { type: 'string' },
      },
      value: { nickname: 'Ada' },
    });

    getBySelector<HTMLButtonElement>(view.container, 'button[aria-label^="Rename "]').click();

    await vi.waitFor(() => {
      expect(document.querySelector('input[id$="-rename-property"]')).toBeTruthy();
    });
    const renameInput = document.querySelector<HTMLInputElement>('input[id$="-rename-property"]')!;
    renameInput.value = 'display.name';
    renameInput.dispatchEvent(new Event('input', { bubbles: true }));

    const before = onchange.mock.calls.length;
    document.querySelector<HTMLButtonElement>('form button[type="submit"]')!.click();

    await vi.waitFor(() => {
      expect(document.body.textContent).toContain('must match pattern "^[a-zA-Z]+$"');
    });
    expect(onchange.mock.calls).toHaveLength(before);
  });
  it('projects active conditional fields in NoValidation and retains inactive values', async () => {
    const conditionalSchema = {
      type: 'object',
      properties: { kind: { type: 'string' } },
      if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
      then: { properties: { vat: { type: 'string' } } },
      else: { properties: { nickname: { type: 'string' } } },
    } as JsonSchema;
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: conditionalSchema,
      value: { kind: 'business', vat: 'BG123', nickname: 'keep me' },
      options: { conditionalFields: true },
    });
    await view.rerender({ validationMode: 'NoValidation' });
    const values = () =>
      Array.from(view.container.querySelectorAll<HTMLInputElement>('input[type="text"]')).map(
        (input) => input.value,
      );
    expect(values()).toContain('BG123');
    expect(values()).not.toContain('keep me');
    await view.rerender({
      data: { value: { kind: 'personal', vat: 'BG123', nickname: 'keep me' } },
    });
    await vi.waitFor(() => expect(values()).toContain('keep me'));
    expect(values()).not.toContain('BG123');
    expect(onchange.mock.lastCall?.[0].data.value).toEqual({
      kind: 'personal',
      vat: 'BG123',
      nickname: 'keep me',
    });
  });

  it('keeps projected conditional fields readonly in NoValidation', async () => {
    const conditionalSchema = {
      type: 'object',
      properties: { kind: { type: 'string' } },
      allOf: [
        {
          if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
          then: { properties: { vat: { type: 'string' } }, required: ['vat'] },
        },
      ],
    } as JsonSchema;
    const data = { value: { kind: 'business', vat: 'VAT123' } };
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: conditionalSchema,
      value: data.value,
      options: { conditionalFields: true },
    });
    await view.rerender({ validationMode: 'NoValidation', readonly: true });
    const vat = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
      (input) => input.value === 'VAT123',
    );
    expect(vat).toBeTruthy();
    expect(vat!.disabled || vat!.readOnly).toBe(true);
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  });

  it('hides a dependency field after host removal of its trigger while preserving imported data', async () => {
    const dependencySchema = {
      type: 'object',
      properties: { purchaseOrder: { type: 'string' } },
      dependencies: {
        purchaseOrder: {
          properties: { billingAddress: { type: 'string' } },
          required: ['billingAddress'],
        },
      },
    } as JsonSchema;
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: dependencySchema,
      value: { purchaseOrder: 'PO-42', billingAddress: 'London' },
      options: { conditionalFields: true },
    });
    const values = () =>
      [...view.container.querySelectorAll<HTMLInputElement>('input[type="text"]')].map(
        (input) => input.value,
      );
    expect(values()).toContain('London');
    await view.rerender({ data: { value: { billingAddress: 'London' } } });
    await vi.waitFor(() => expect(values()).not.toContain('London'));
    expect(onchange.mock.lastCall?.[0].data.value).toEqual({ billingAddress: 'London' });
    await view.rerender({
      data: { value: { purchaseOrder: 'PO-99', billingAddress: 'London' } },
    });
    await vi.waitFor(() => expect(values()).toContain('London'));
    expect(onchange.mock.lastCall?.[0].data.value).toEqual({
      purchaseOrder: 'PO-99',
      billingAddress: 'London',
    });
  });

  it('uses the namespaced conditional-fields default and honors a local false', async () => {
    const conditionalSchema = {
      type: 'object',
      properties: { kind: { type: 'string' } },
      if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
      then: { properties: { vat: { type: 'string' } } },
    } as JsonSchema;
    const uischema = { type: 'Control', scope: '#/properties/value' } as const;
    const { view } = await mountForm({
      renderers,
      schema: { type: 'object', properties: { value: conditionalSchema } } as JsonSchema,
      uischema,
      data: { value: { kind: 'business' } },
      config: { jsonformsExtended: { conditionalFields: true } },
    });
    await vi.waitFor(() => expect(view.container.textContent).toContain('Vat'));
    await view.rerender({ uischema: { ...uischema, options: { conditionalFields: false } } });
    await vi.waitFor(() => expect(view.container.textContent).not.toContain('Vat'));
  });

  it('reports a conditional projection failure to authors without changing form data', async () => {
    const ajv = createAjv();
    const compile = ajv.compile.bind(ajv);
    vi.spyOn(ajv, 'compile').mockImplementation((candidate) => {
      if ((candidate as JsonSchema).properties?.kind?.const === 'business')
        throw new Error('condition compile failed');
      return compile(candidate);
    });
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const propertySchema = {
      type: 'object',
      properties: { kind: { type: 'string' } },
      if: { properties: { kind: { const: 'business' } } },
      then: { properties: { vat: { type: 'string' } } },
    } as JsonSchema;
    const data = { value: { kind: 'business' } };
    const { view, onchange } = await mountForm({
      renderers,
      ajv,
      schema: { type: 'object', properties: { value: propertySchema } } as JsonSchema,
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { conditionalFields: true },
      },
      data,
    });
    await vi.waitFor(() =>
      expect(warning).toHaveBeenCalledWith('conditional.evaluationFailed', {
        severity: 'warning',
        message: 'Conditional field evaluation failed.',
        path: 'value',
      }),
    );
    expect(view.container.querySelector('[role="status"]')?.textContent).toBeTruthy();
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    await view.rerender({ data: { value: { kind: 'personal' } } });
    expect(
      warning.mock.calls.filter(([code]) => code === 'conditional.evaluationFailed'),
    ).toHaveLength(1);
  });
  it('reports an unresolved conditional reference through the form callback', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const ondiagnostic = vi.fn();
    const data = { value: { kind: 'business' } };
    const propertySchema = {
      type: 'object',
      properties: { kind: { type: 'string' } },
      allOf: [{ $ref: '#/definitions/missing' }],
    } as JsonSchema;
    const { view, onchange } = await mountForm({
      renderers,
      schema: { type: 'object', properties: { value: propertySchema } } as JsonSchema,
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { conditionalFields: true },
      },
      data,
      validationMode: 'NoValidation',
      ondiagnostic,
    });
    await vi.waitFor(() =>
      expect(ondiagnostic).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'conditional.referenceFailed',
          severity: 'warning',
          details: { path: 'value' },
        }),
      ),
    );
    expect(
      warning.mock.calls.filter(([code]) => code === 'conditional.referenceFailed'),
    ).toHaveLength(1);
    expect(view.container.querySelector('[role="status"]')?.textContent).toBeTruthy();
    const repairedSchema = {
      type: 'object',
      definitions: {
        missing: {
          if: { properties: { kind: { const: 'business' } }, required: ['kind'] },
          then: { properties: { vat: { type: 'string' } } },
        },
      },
      properties: { value: propertySchema },
    } as JsonSchema;
    await view.rerender({ schema: repairedSchema });
    await vi.waitFor(() => expect(view.container.querySelector('[role="status"]')).toBeNull());
    expect(ondiagnostic).toHaveBeenCalledTimes(1);
    await view.rerender({
      schema: { type: 'object', properties: { value: propertySchema } } as JsonSchema,
    });
    await vi.waitFor(() => expect(ondiagnostic).toHaveBeenCalledTimes(2));
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  });

  it('renders ordinary fields from a referenced allOf branch with conditional projection enabled', async () => {
    const schema = {
      type: 'object',
      definitions: { Extra: { properties: { vat: { type: 'string' } } } },
      properties: {
        value: {
          type: 'object',
          properties: { kind: { type: 'string' } },
          allOf: [{ $ref: '#/definitions/Extra' }],
        },
      },
    } as JsonSchema;
    const data = { value: { kind: 'business', vat: 'BG123' } };
    const { view, onchange } = await mountForm({
      renderers,
      schema,
      data,
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { conditionalFields: true },
      },
    });
    expect(
      [...view.container.querySelectorAll<HTMLInputElement>('input[type="text"]')].map(
        (input) => input.value,
      ),
    ).toEqual(['business', 'BG123']);
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  });
});
