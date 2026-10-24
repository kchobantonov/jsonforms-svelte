import { defineNativeTemplate } from '../../src/lib/core/defineNativeTemplate';
import type { JsonSchema, UISchemaElement, Translator } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import JsonForms from '../../src/lib/components/JsonForms.svelte';
import {
  nativeTemplateLayoutRendererEntry,
  templateLayoutRendererEntry,
} from '../../src/lib/layouts';
import NativeTemplate from '../fixtures/NativeTemplate.svelte';
import CaptureRenderer from '../fixtures/CaptureRenderer.svelte';
afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});

it.each([false, true])(
  'renders a trusted compiled component without script permission and updates its bindings (mount adapter: %s)',
  async (bridge) => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const destroyed = vi.fn();
    const schema: JsonSchema = {
      type: 'object',
      required: ['value'],
      properties: { value: { type: 'string' } },
    };
    const uischema = {
      type: 'TemplateLayout',
      template: bridge ? defineNativeTemplate(NativeTemplate) : NativeTemplate,
      elements: [{ type: 'Control', scope: '#/properties/value', name: 'field' }],
    } as unknown as UISchemaElement;
    const view = await render(JsonForms, {
      props: {
        schema,
        context: { onNativeDestroy: destroyed },
        data: { value: 'Before' },
        uischema,
        config: { jsonformsExtended: { security: { allowScriptEvaluation: false } } },
        renderers: [
          nativeTemplateLayoutRendererEntry,
          templateLayoutRendererEntry,
          { tester: () => 1, renderer: CaptureRenderer },
        ],
      },
    });
    await expect.element(page.getByText('Native component', { exact: true })).toBeVisible();
    await expect
      .element(page.getByTestId('uischema-json'))
      .toMatchTextContent('#/properties/value');
    await expect.element(page.getByTestId('native-data')).toMatchTextContent('Before');
    await expect
      .element(page.getByTestId('native-permissions'))
      .toMatchTextContent('enabled / editable');
    await expect.element(page.getByText('Native fallback', { exact: true })).toBeVisible();
    expect(warning).toHaveBeenCalledWith('template.unknownSlot: "missing"');
    await view.rerender({
      data: {},
      config: {
        jsonformsExtended: {
          security: { urlPolicy: { allowedSchemes: ['https'], allowRelative: false } },
        },
      },
      readonly: true,
      i18n: {
        locale: 'fr-CA',
        translate: ((key: string, fallback?: string) =>
          key === 'native.title' ? 'Composant natif' : fallback) as Translator,
      },
    });
    await expect.element(page.getByText('Composant natif', { exact: true })).toBeVisible();
    await expect.element(page.getByTestId('native-errors')).toMatchTextContent('1');
    await expect.element(page.getByTestId('native-url-policy')).toMatchTextContent(
      JSON.stringify({
        allowedSchemes: ['https'],
        allowRelative: false,
        allowImageDataUrls: false,
      }),
    );
    await expect
      .element(page.getByTestId('native-permissions'))
      .toMatchTextContent('disabled / readonly');
    expect(view.container.textContent).not.toContain('Before');
    await view.rerender({
      readonly: false,
      uischema: { ...uischema, options: { readonly: true } } as UISchemaElement,
    });
    await expect
      .element(page.getByTestId('native-permissions'))
      .toMatchTextContent('disabled / editable');
    await view.unmount();
    await vi.waitFor(() => expect(destroyed).toHaveBeenCalledTimes(1));
  },
);

it('selects native components ahead of string engines and keeps unknown strings on diagnostics', () => {
  const context = { rootSchema: {}, config: {} };
  const native = { type: 'TemplateLayout', template: NativeTemplate } as unknown as UISchemaElement;
  expect(nativeTemplateLayoutRendererEntry.tester(native, {}, context)).toBe(3);
  expect(
    nativeTemplateLayoutRendererEntry.tester(
      { type: 'TemplateLayout', template: '<p />' } as unknown as UISchemaElement,
      {},
      context,
    ),
  ).toBe(-1);
});
