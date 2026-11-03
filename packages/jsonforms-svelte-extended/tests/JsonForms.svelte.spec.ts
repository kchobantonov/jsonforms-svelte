import {
  rankWith,
  type JsonFormsUISchemaRegistryEntry,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type UISchemaElement,
} from '@jsonforms/core';
import { describe, expect, it, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
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
  it('reports an unhandled action once without adding a form error and accepts a later handler', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onchange = vi.fn();
    const onhandleaction = vi.fn();
    const ondiagnostic = vi.fn();
    try {
      const view = await render(JsonForms, {
        props: {
          data: { status: 'Idle' },
          schema: { type: 'object', properties: { status: { type: 'string' } } },
          uischema: { type: 'Button', label: 'Run', action: 'run' } as UISchemaElement,
          renderers: buttonRenderers,
          onchange,
          ondiagnostic,
        },
      });
      const button = page.getByRole('button', { name: 'Run' });
      await button.click();
      await button.click();
      await vi.waitFor(() =>
        expect(warn).toHaveBeenCalledExactlyOnceWith('action.unhandled', {
          severity: 'warning',
          message: 'No host action handler is registered for this action.',
          details: { action: 'run', element: 'Button' },
        }),
      );
      expect(ondiagnostic).toHaveBeenCalledExactlyOnceWith({
        code: 'action.unhandled',
        severity: 'warning',
        message: 'No host action handler is registered for this action.',
        details: { action: 'run', element: 'Button' },
      });
      expect(onchange.mock.lastCall?.[0].errors ?? []).toEqual([]);
      await view.rerender({ onhandleaction });
      await button.click();
      await vi.waitFor(() => expect(onhandleaction).toHaveBeenCalledTimes(1));
      expect(warn).toHaveBeenCalledTimes(1);
      await view.rerender({ onhandleaction: undefined });
      await button.click();
      await vi.waitFor(() =>
        expect(
          ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'action.unhandled'),
        ).toHaveLength(2),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('re-reports an unhandled action after a handler is added and removed without a click', async () => {
    const ondiagnostic = vi.fn();
    const view = await render(JsonForms, {
      props: {
        data: { status: 'Idle' },
        schema: { type: 'object', properties: { status: { type: 'string' } } },
        uischema: { type: 'Button', label: 'Run', action: 'run' } as UISchemaElement,
        renderers: buttonRenderers,
        ondiagnostic,
      },
    });
    const button = page.getByRole('button', { name: 'Run' });
    const warnings = () =>
      ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'action.unhandled');
    await button.click();
    await vi.waitFor(() => expect(warnings()).toHaveLength(1));
    await view.rerender({ onhandleaction: vi.fn() });
    await view.rerender({ onhandleaction: undefined });
    await button.click();
    await vi.waitFor(() => expect(warnings()).toHaveLength(2));
    expect(view.container.textContent).toContain('Run');
  });

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

    const view = await render(JsonForms, {
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

    const replacementStore = { jsonforms: { locale: { value: 'bg' } } };
    const nextHandler = vi.fn();
    await view.rerender({
      context: { appStore: replacementStore, hostRevision: 'app-owned' },
      onhandleaction: nextHandler,
    });
    await button.click();
    await vi.waitFor(() => expect(nextHandler).toHaveBeenCalledTimes(1));
    expect(onhandleaction).toHaveBeenCalledTimes(1);
    expect(nextHandler.mock.lastCall?.[0].context.appStore).toBe(replacementStore);
    expect(nextHandler.mock.lastCall?.[0].context.hostRevision).toBe('app-owned');
  });

  it('keeps internal data in sync with incoming prop changes', async () => {
    const onchange = vi.fn();

    const view = await render(JsonForms, {
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

    await render(JsonForms, {
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
    const ondiagnostic = vi.fn();
    const view = await render(JsonForms, {
      props: {
        data: { value: 'hello' },
        schema: {
          type: 'object',
          properties: {
            value: { type: 'string' },
          },
        },
        renderers: captureRenderers,
        ondiagnostic,
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

    await expect.element(page.getByTestId('uischemas-count')).toMatchTextContent('1');
    await expect
      .element(page.getByTestId('first-uischema-tester-type'))
      .toMatchTextContent('function');
    await expect.element(page.getByTestId('first-uischema-rank')).toMatchTextContent(/^-1$/);
    expect(ondiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'script.evaluationDisabled',
        severity: 'warning',
        details: { capability: 'uischema.tester[0]' },
      }),
    );
    await view.rerender({
      config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
    });
    await expect.element(page.getByTestId('first-uischema-rank')).toMatchTextContent(/^1$/);
    await view.rerender({ config: {} });
    await expect.element(page.getByTestId('first-uischema-rank')).toMatchTextContent(/^-1$/);
  });

  it('delivers a failed permitted UI-schema tester to the author channel', async () => {
    const ondiagnostic = vi.fn();
    const entry = (tester: string) => [
      {
        tester,
        uischema: { type: 'Control', scope: '#/properties/value' },
      } as unknown as JsonFormsUISchemaRegistryEntry,
    ];
    const view = await render(JsonForms, {
      props: {
        data: { value: 'kept' },
        schema: { type: 'object', properties: { value: { type: 'string' } } },
        renderers: captureRenderers,
        uischemas: entry('() => { throw new Error("sensitive"); }'),
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        ondiagnostic,
      },
    });
    const warnings = () =>
      ondiagnostic.mock.calls
        .map(([diagnostic]) => diagnostic)
        .filter((diagnostic) => diagnostic.code === 'script.evaluationFailed');
    await expect.element(page.getByTestId('first-uischema-rank')).toMatchTextContent(/^-1$/);
    await vi.waitFor(() => expect(warnings()).toHaveLength(1));
    expect(warnings()[0]).toEqual({
      code: 'script.evaluationFailed',
      severity: 'error',
      message: 'UI-schema tester evaluation failed.',
      details: { capability: 'uischema.tester[0]', reason: 'exception' },
    });
    await view.rerender({ data: { value: 'changed' } });
    expect(warnings()).toHaveLength(1);
    await view.rerender({ uischemas: entry('() => 1') });
    await expect.element(page.getByTestId('first-uischema-rank')).toMatchTextContent(/^1$/);
    await view.rerender({ uischemas: entry('() => { throw new Error("sensitive"); }') });
    await expect.element(page.getByTestId('first-uischema-rank')).toMatchTextContent(/^-1$/);
    await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  });

  it('reports a denied dynamic default again when the same schema object returns', async () => {
    const ondiagnostic = vi.fn();
    const dynamicSchema = {
      type: 'object',
      properties: { greeting: { type: 'string' } },
      dynamicDefaults: {
        greeting: { func: 'dynamic', args: { func: '() => "Hello"' } },
      },
    };
    const plainSchema = {
      type: 'object',
      properties: { greeting: { type: 'string' } },
    };
    const view = await render(JsonForms, {
      props: {
        data: {},
        schema: dynamicSchema,
        uischema: { type: 'Control', scope: '#/properties/greeting' },
        renderers: captureRenderers,
        ondiagnostic,
      },
    });
    const warnings = () =>
      ondiagnostic.mock.calls.filter(
        ([diagnostic]) =>
          diagnostic.code === 'script.evaluationDisabled' &&
          diagnostic.details?.capability === 'dynamicDefaults',
      );
    await vi.waitFor(() => expect(warnings()).toHaveLength(1));
    await view.rerender({ data: {} });
    expect(warnings()).toHaveLength(1);
    await view.rerender({ schema: plainSchema });
    await expect.element(page.getByTestId('schema-json')).not.toMatchTextContent('dynamicDefaults');
    await view.rerender({ schema: dynamicSchema });
    await vi.waitFor(() => expect(warnings()).toHaveLength(2));
  });
});

it('shares root inference with the base host and preserves an authored empty schema', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, { props: { renderers: captureRenderers, onchange } });
  await expect.element(page.getByTestId('schema-json')).toMatchTextContent('{}');
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
  await expect.element(page.getByTestId('schema-json')).toMatchTextContent('{}');
  await view.rerender({ schema: undefined, data: undefined });
  await expect.poll(() => onchange.mock.lastCall?.[0].data).toBeUndefined();
  await expect.element(page.getByTestId('uischema-json')).toMatchTextContent('"scope":"#"');
});
