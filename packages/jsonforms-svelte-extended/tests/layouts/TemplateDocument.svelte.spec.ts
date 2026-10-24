import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import type { UISchemaElement } from '@jsonforms/core';
import type { useDetailDialog } from '@chobantonov/jsonforms-svelte';
import JsonForms from '../../src/lib/components/JsonForms.svelte';
import {
  nativeTemplateLayoutRendererEntry,
  templateLayoutRendererEntry,
} from '../../src/lib/layouts';
import { defineNativeTemplate } from '../../src/lib/core/defineNativeTemplate';
import TemplateDocument from '../fixtures/TemplateDocument.svelte';
import TemplateField from '../fixtures/TemplateField.svelte';
import LiteralTemplateHost from '../fixtures/LiteralTemplateHost.svelte';
afterEach(cleanup);
it.each(['ractive', 'native', 'bridge'])(
  'uses the isolated form data in %s templates and dialog drafts',
  async (profile) => {
    let capture: { editor: ReturnType<typeof useDetailDialog> };
    const data = { 'a.b': { name: 'Original' }, heading: 'Applicants' };
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            'a.b': { type: 'object', properties: { name: { type: 'string' } } },
            heading: { type: 'string' },
          },
        },
        data,
        config: { jsonformsExtended: { security: { allowScriptEvaluation: true } } },
        uischema: {
          type: 'Control',
          scope: '#/properties/a.b',
          options: {
            capture: (value: typeof capture) => {
              capture = value;
            },
            template: {
              type: 'TemplateLayout',
              elements: [{ type: 'Control', scope: '#/properties/name', name: 'field' }],
              template:
                profile === 'ractive'
                  ? '<output data-testid="template-document">{{JSON.stringify(data)}}</output>{{>field}}'
                  : profile === 'bridge'
                    ? defineNativeTemplate(TemplateDocument)
                    : TemplateDocument,
            },
          },
        } as UISchemaElement,
        renderers: [
          nativeTemplateLayoutRendererEntry,
          templateLayoutRendererEntry,
          { tester: (ui) => (ui.type === 'Control' ? 1 : -1), renderer: TemplateField },
          {
            tester: (ui) => (ui.type === 'Control' && ui.options?.template ? 100 : -1),
            renderer: LiteralTemplateHost,
          },
        ],
        onchange,
      },
    });
    const shown = () =>
      view.container.querySelector('[data-testid="template-document"]')?.textContent;
    await expect.poll(shown).toBe(JSON.stringify(data['a.b']));
    capture!.editor.begin();
    await view.getByRole('textbox', { name: 'Name', exact: true }).fill('Draft');
    await expect.poll(shown).toBe(JSON.stringify({ name: 'Draft' }));
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    await view.rerender({ data: { ...data, heading: 'Кандидати' } });
    await expect.poll(shown).toBe(JSON.stringify({ name: 'Draft' }));
    capture!.editor.cancel();
    await expect.poll(shown).toBe(JSON.stringify(data['a.b']));
    capture!.editor.begin();
    await view.getByRole('textbox', { name: 'Name', exact: true }).fill('Applied');
    expect(capture!.editor.apply()).toBe(true);
    await expect
      .poll(() => onchange.mock.lastCall?.[0].data)
      .toEqual({ 'a.b': { name: 'Applied' }, heading: 'Кандидати' });
  },
);
