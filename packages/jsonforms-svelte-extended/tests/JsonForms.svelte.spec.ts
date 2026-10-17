import {
  rankWith,
  type JsonFormsUISchemaRegistryEntry,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type UISchemaElement,
} from '@jsonforms/core';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import type { JsonFormsProps } from '../src/lib/components/JsonForms.svelte';
import type { ActionEvent } from '../src/lib/core/types';
import ButtonRenderer from './fixtures/ButtonRenderer.svelte';
import CaptureRenderer from './fixtures/CaptureRenderer.svelte';

const buttonRenderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: rankWith(1, uiTypeIs('Button')),
    renderer: ButtonRenderer,
  },
];

const captureRenderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: rankWith(1, () => true),
    renderer: CaptureRenderer,
  },
];

describe('Extended JsonForms.svelte', () => {
  it('fires handle-action and lets the callback update form data', async () => {
    const onchange = vi.fn();
    const appStore = { jsonforms: { locale: { value: 'en' } } };
    const onhandleaction = vi.fn((event: ActionEvent) => {
      event.callback = (source: ActionEvent) => {
        source.context.data = {
          ...(source.context.data ?? {}),
          status: source.params.status,
        };
      };
    });

    render(JsonForms, {
      props: {
        data: { status: 'Idle' },
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
          params: { status: 'Updated from action' },
        } satisfies Record<string, unknown> as UISchemaElement,
        renderers: buttonRenderers,
        onchange,
        context: { appStore },
        onhandleaction,
      },
    });

    const button = page.getByRole('button', { name: 'Apply action' });
    await expect.element(button).toBeInTheDocument();
    await button.click();

    await vi.waitFor(() => {
      expect(onhandleaction).toHaveBeenCalled();
    });

    expect(onhandleaction.mock.lastCall?.[0].action).toBe('applyStatus');
    expect(onhandleaction.mock.lastCall?.[0].params).toEqual({
      status: 'Updated from action',
    });
    expect(onhandleaction.mock.lastCall?.[0].context.appStore).toBe(appStore);
    expect(onhandleaction.mock.lastCall?.[0].element).toMatchObject({
      type: 'Button',
      action: 'applyStatus',
    });

    await vi.waitFor(() => {
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        status: 'Updated from action',
      });
    });
  });

  it('keeps internal data in sync with incoming prop changes', async () => {
    const onchange = vi.fn();

    const view = render(JsonForms, {
      props: {
        data: { status: 'Idle' },
        schema: {
          type: 'object',
          properties: {
            status: { type: 'string' },
          },
        },
        renderers: [],
        onchange,
      },
    });

    await vi.waitFor(() => {
      expect(onchange).toHaveBeenCalled();
    });

    await view.rerender({
      data: { status: 'Updated externally' },
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
        },
      },
      renderers: [],
      onchange,
    });

    await vi.waitFor(() => {
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        status: 'Updated externally',
      });
    });
  });

  it('uses the extended default ajv for translated errorMessage validation', async () => {
    const onchange = vi.fn();

    render(JsonForms, {
      props: {
        data: {},
        schema: {
          type: 'object',
          required: ['age'],
          errorMessage: {
            required: {
              age: 'age.required',
            },
          },
          properties: {
            age: {
              type: 'integer',
            },
          },
        },
        renderers: [],
        onchange,
        i18n: {
          locale: 'en',
          translate: (key: string, defaultMessage: string | undefined) => {
            if (key === 'error.errorMessage.age.required') {
              return 'Age is required';
            }

            return defaultMessage ?? key;
          },
        },
      },
    });

    await vi.waitFor(() => {
      expect(onchange).toHaveBeenCalled();
    });

    expect(
      onchange.mock.calls.some((call) =>
        call[0].errors?.some((error: { message?: string }) => error.message === 'Age is required'),
      ),
    ).toBe(true);
  });

  it('applies live host permission to string testers before passing them to JSON Forms', async () => {
    const view = render(JsonForms, {
      props: {
        data: { value: 'hello' },
        schema: {
          type: 'object',
          properties: {
            value: { type: 'string' },
          },
        },
        renderers: captureRenderers,
        uischemas: [
          {
            tester: '() => 1',
            uischema: {
              type: 'Control',
              scope: '#/properties/value',
            },
          } as unknown as JsonFormsUISchemaRegistryEntry,
        ] as JsonFormsProps['uischemas'],
      },
    });

    await expect.element(page.getByTestId('uischemas-count')).toHaveTextContent('1');
    await expect
      .element(page.getByTestId('first-uischema-tester-type'))
      .toHaveTextContent('function');
    await expect.element(page.getByTestId('first-uischema-rank')).toHaveTextContent(/^-1$/);
    await view.rerender({
      config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
    });
    await expect.element(page.getByTestId('first-uischema-rank')).toHaveTextContent(/^1$/);
    await view.rerender({ config: {} });
    await expect.element(page.getByTestId('first-uischema-rank')).toHaveTextContent(/^-1$/);
  });
});

it('shares root inference with the base host and preserves an authored empty schema', async () => {
  const onchange = vi.fn();
  const view = render(JsonForms, { props: { renderers: captureRenderers, onchange } });
  await expect.element(page.getByTestId('schema-json')).toHaveTextContent('{}');
  for (const [data, type] of [
    ['hello', 'string'],
    [12, 'integer'],
    [1.5, 'number'],
    [false, 'boolean'],
    [null, 'null'],
    [['first'], 'array'],
    [{ value: 'text' }, 'object'],
  ] as const) {
    await view.rerender({ data });
    await expect
      .poll(() => JSON.parse(page.getByTestId('schema-json').element().textContent!).type)
      .toBe(type);
    await expect.poll(() => onchange.mock.lastCall?.[0].data).toEqual(data);
  }
  await view.rerender({ schema: {}, data: 'hello' });
  await expect.element(page.getByTestId('schema-json')).toHaveTextContent('{}');
  await view.rerender({ schema: undefined, data: undefined });
  await expect.poll(() => onchange.mock.lastCall?.[0].data).toBeUndefined();
  await expect.element(page.getByTestId('uischema-json')).toHaveTextContent('"scope":"#"');
});
