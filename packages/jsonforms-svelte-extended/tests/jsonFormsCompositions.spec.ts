import { createTranslator } from '@jsonforms/core';
import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
} from '@jsonforms/core';
import { describe, expect, it } from 'vite-plus/test';
import { mapStateToButtonProps } from '../src/lib/jsonFormsCompositions.svelte.ts';

describe('mapStateToButtonProps', () => {
  it('maps label, actions, and registry references for button controls', () => {
    const renderers = [{}] as JsonFormsRendererRegistryEntry[];
    const cells = [{}] as JsonFormsCellRendererRegistryEntry[];

    const result = mapStateToButtonProps(
      {
        jsonforms: {
          core: {
            data: { status: 'Idle' },
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string' },
              },
            },
            uischema: {
              type: 'VerticalLayout',
              elements: [],
            },
            errors: [],
          },
          config: {
            translated: true,
          },
          i18n: {
            locale: 'en',
            translate: (_key: string, defaultMessage: string | undefined) =>
              `translated:${defaultMessage}`,
          },
          renderers,
          cells,
          readonly: false,
          uischemas: [],
        },
      },
      {
        schema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
        uischema: {
          type: 'Button',
          label: 'Apply action',
          action: 'applyStatus',
          script: 'return true;',
          params: { status: 'Updated' },
          color: 'error',
        },
        path: '',
      },
    );

    expect(result.label).toBe('translated:Apply action');
    expect(result.action).toBe('applyStatus');
    expect(result.script).toBe('return true;');
    expect(result.params).toEqual({ status: 'Updated' });
    expect(result.color).toBe('error');
    expect(result.enabled).toBe(true);
    expect(result.renderers).toBe(renderers);
    expect(result.cells).toBe(cells);
  });

  it('respects an explicit hidden state from own props', () => {
    const result = mapStateToButtonProps(
      {
        jsonforms: {
          core: {
            data: {},
            schema: {
              type: 'object',
              properties: {},
            },
            uischema: {
              type: 'VerticalLayout',
              elements: [],
            },
            errors: [],
          },
          config: {},
          i18n: {
            locale: 'en',
            translate: createTranslator((_key, defaultMessage) => defaultMessage),
          },
          renderers: [],
          cells: [],
          readonly: false,
          uischemas: [],
        },
      },
      {
        schema: {
          type: 'object',
          properties: {},
        },
        uischema: {
          type: 'Button',
          label: 'Hidden action',
        },
        path: '',
        visible: false,
      },
    );

    expect(result.visible).toBe(false);
  });
});

it('evaluates Button schema rules on normalized copies with the extended validator', async () => {
  const { createAjv } = await import('../src/lib/core/validate');
  const { RuleEffect } = await import('@jsonforms/core');
  const ajv = createAjv();
  const data = { code: '  pending  ' };
  const state = {
    jsonforms: {
      core: {
        data,
        schema: { type: 'object' },
        uischema: { type: 'VerticalLayout' },
        errors: [],
        ajv,
      },
      config: {},
    },
  };
  for (const effect of [RuleEffect.SHOW, RuleEffect.DISABLE]) {
    const result = mapStateToButtonProps(state, {
      schema: { type: 'object' },
      path: '',
      uischema: {
        type: 'Button',
        label: 'Run',
        rule: {
          effect,
          condition: {
            scope: '#',
            schema: {
              type: 'object',
              allOf: [
                {
                  properties: {
                    code: { type: 'string', ...{ transform: ['trim', 'toUpperCase'] } },
                    added: { default: 'value' },
                  },
                },
                { properties: { code: { const: 'PENDING' } }, required: ['added'] },
              ],
            },
          },
        },
      },
    });
    expect(result.visible).toBe(true);
    expect(result.enabled).toBe(effect !== RuleEffect.DISABLE);
    expect(data).toEqual({ code: '  pending  ' });
  }
});
