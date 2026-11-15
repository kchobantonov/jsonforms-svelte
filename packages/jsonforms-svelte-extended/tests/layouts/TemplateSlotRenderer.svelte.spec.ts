import {
  rankWith,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type JsonFormsUISchemaRegistryEntry,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});
import { page } from 'vite-plus/test/browser';
import JsonForms from '../../src/lib/components/JsonForms.svelte';
import { slotRendererEntry, templateRendererEntry } from '../../src/lib/layouts';
import RecursiveLayoutRenderer from '../fixtures/RecursiveLayoutRenderer.svelte';
import TextRenderer from '../fixtures/TextRenderer.svelte';
import NestedTemplateHost from '../fixtures/NestedTemplateHost.svelte';
import TemplateField from '../fixtures/TemplateField.svelte';

const verticalLayoutRendererEntry: JsonFormsRendererRegistryEntry = {
  tester: rankWith(1, uiTypeIs('VerticalLayout')),
  renderer: RecursiveLayoutRenderer,
};

const labelRendererEntry: JsonFormsRendererRegistryEntry = {
  tester: rankWith(1, uiTypeIs('Label')),
  renderer: TextRenderer,
};

const schema: JsonSchema = {
  type: 'object',
  properties: {
    value: { type: 'string' },
  },
};

const createRegistryEntry = (uischema: UISchemaElement): JsonFormsUISchemaRegistryEntry => ({
  tester: () => -1,
  uischema,
});

describe('Template and Slot renderers', () => {
  it('resolves named templates and applies slot overrides from parent templates', async () => {
    await render(JsonForms, {
      props: {
        data: { value: 'Initial value' },
        schema,
        uischema: {
          type: 'Template',
          name: 'page',
          elements: [
            {
              type: 'Label',
              name: 'footer',
              text: 'Overridden Footer',
            },
          ],
        } as unknown as UISchemaElement,
        uischemas: [
          createRegistryEntry({
            type: 'VerticalLayout',
            name: 'page',
            elements: [
              {
                type: 'Slot',
                name: 'header',
                elements: [
                  {
                    type: 'Label',
                    text: 'Default Header',
                  },
                ],
              },
              {
                type: 'Slot',
                name: 'content',
                elements: [
                  {
                    type: 'Template',
                    name: 'content',
                  },
                ],
              },
              {
                type: 'Slot',
                name: 'footer',
                elements: [
                  {
                    type: 'Label',
                    text: 'Default Footer',
                  },
                ],
              },
            ],
          } as unknown as UISchemaElement),
          createRegistryEntry({
            type: 'VerticalLayout',
            name: 'content',
            elements: [
              {
                type: 'Label',
                text: 'Nested Content',
              },
            ],
          } as unknown as UISchemaElement),
        ],
        renderers: [
          templateRendererEntry,
          slotRendererEntry,
          verticalLayoutRendererEntry,
          labelRendererEntry,
        ],
      },
    });

    await expect.element(page.getByText('Default Header')).toBeInTheDocument();
    await expect.element(page.getByText('Nested Content')).toBeInTheDocument();
    await expect.element(page.getByText('Overridden Footer')).toBeInTheDocument();
    await expect.element(page.getByText('Default Footer')).not.toBeInTheDocument();
  });

  it('falls back to the first slot element when no named content is provided', async () => {
    await render(JsonForms, {
      props: {
        data: {},
        schema,
        uischema: {
          type: 'Slot',
          name: 'missing',
          elements: [
            {
              type: 'Label',
              text: 'Fallback Slot Content',
            },
          ],
        } as unknown as UISchemaElement,
        renderers: [slotRendererEntry, labelRendererEntry],
      },
    });

    await expect.element(page.getByText('Fallback Slot Content')).toBeInTheDocument();
  });
});

const templateTestRenderers = [
  templateRendererEntry,
  slotRendererEntry,
  verticalLayoutRendererEntry,
  labelRendererEntry,
];
it('stops indirect template cycles while allowing independent sibling reuse', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const first = {
    type: 'VerticalLayout',
    name: 'first',
    elements: [
      { type: 'Label', text: 'Independent content' },
      { type: 'Template', name: 'second' },
    ],
  } as unknown as UISchemaElement;
  const second = {
    type: 'VerticalLayout',
    name: 'second',
    elements: [{ type: 'Template', name: 'first' }],
  } as unknown as UISchemaElement;
  const view = await render(JsonForms, {
    props: {
      schema,
      data: {},
      uischema: {
        type: 'VerticalLayout',
        elements: [
          { type: 'Template', name: 'first' },
          { type: 'Template', name: 'first' },
        ],
      } as unknown as UISchemaElement,
      uischemas: [createRegistryEntry(first), createRegistryEntry(second)],
      renderers: templateTestRenderers,
    },
  });
  await vi.waitFor(() =>
    expect(warning).toHaveBeenCalledWith('template.cycle', {
      severity: 'warning',
      message: 'The named template resolves through a cycle.',
      path: '',
      details: { name: 'first' },
    }),
  );
  expect(view.container.textContent?.match(/Independent content/g)).toHaveLength(2);
  expect(
    view.container.querySelectorAll('[data-template-diagnostic="template.cycle"]'),
  ).toHaveLength(2);
  expect(view.container.textContent).toContain('This template cannot be displayed');
});
it('diagnoses missing and duplicate names, keeps first exact match and never evaluates testers', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const ondiagnostic = vi.fn();
  const tester = vi.fn(() => {
    throw new Error('Named lookup must not run testers');
  });
  const first = { type: 'Label', name: 'Card', text: 'First match' } as unknown as UISchemaElement;
  const view = await render(JsonForms, {
    props: {
      schema,
      data: {},
      uischema: { type: 'Template', name: 'Card' } as unknown as UISchemaElement,
      uischemas: [
        { tester, uischema: first },
        { tester, uischema: { ...first, text: 'Second match' } as UISchemaElement },
      ],
      renderers: templateTestRenderers,
      ondiagnostic,
    },
  });
  await expect.element(page.getByText('First match', { exact: true })).toBeVisible();
  expect(view.container.textContent).not.toContain('Second match');
  expect(tester).not.toHaveBeenCalled();
  await vi.waitFor(() =>
    expect(warning).toHaveBeenCalledWith('template.duplicate', {
      severity: 'warning',
      message: 'Several registered templates have the same name; the first is used.',
      path: '',
      details: { name: 'Card' },
    }),
  );
  await view.rerender({ data: { updated: true } });
  expect(warning.mock.calls.filter(([code]) => code === 'template.duplicate')).toHaveLength(1);
  expect(
    ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'template.duplicate'),
  ).toHaveLength(1);
  await view.rerender({
    uischema: { type: 'Template', name: 'card' } as unknown as UISchemaElement,
  });
  await vi.waitFor(() =>
    expect(warning).toHaveBeenCalledWith('template.missing', {
      severity: 'warning',
      message: 'The named template is not registered.',
      path: '',
      details: { name: 'card' },
    }),
  );
  expect(view.container.textContent).not.toContain('First match');
  expect(
    view.container.querySelector('[data-template-diagnostic="template.missing"]')?.textContent,
  ).toBe('This template is unavailable.');
  await view.rerender({ i18n: { locale: 'bg' } });
  await vi.waitFor(() =>
    expect(
      view.container.querySelector('[data-template-diagnostic="template.missing"]')?.textContent,
    ).toBe('Този шаблон не е наличен.'),
  );
  expect(
    ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'template.missing'),
  ).toHaveLength(1);
  await view.rerender({ uischema: { type: 'Template', name: 'Card' } as UISchemaElement });
  await expect.element(page.getByText('First match', { exact: true })).toBeVisible();
  await view.rerender({ uischema: { type: 'Template', name: 'card' } as UISchemaElement });
  await vi.waitFor(() =>
    expect(
      ondiagnostic.mock.calls.filter(([diagnostic]) => diagnostic.code === 'template.missing'),
    ).toHaveLength(2),
  );
});

it('treats slot names as literal own keys and keeps only the first fallback child', async () => {
  await render(JsonForms, {
    props: {
      schema,
      data: {},
      uischema: {
        type: 'Template',
        name: 'card',
        elements: [{ type: 'Label', name: '__proto__', text: 'Literal supplied value' }],
      } as unknown as UISchemaElement,
      uischemas: [
        createRegistryEntry({
          type: 'VerticalLayout',
          name: 'card',
          elements: [
            { type: 'Slot', name: '__proto__' },
            {
              type: 'Slot',
              name: 'toString',
              elements: [
                { type: 'Label', text: 'First fallback' },
                { type: 'Label', text: 'Ignored fallback' },
              ],
            },
          ],
        } as unknown as UISchemaElement),
      ],
      renderers: templateTestRenderers,
    },
  });
  await expect.element(page.getByText('Literal supplied value', { exact: true })).toBeVisible();
  await expect.element(page.getByText('First fallback', { exact: true })).toBeVisible();
  expect(page.getByText('Ignored fallback', { exact: true }).query()).toBeNull();
});

it('dispatches a named template and slot at the caller’s literal property path', async () => {
  const data = { 'a.b': { name: 'Original' }, a: { b: { name: 'Nested lookalike' } } };
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          'a.b': { type: 'object', properties: { name: { type: 'string' } } },
          a: {
            type: 'object',
            properties: { b: { type: 'object', properties: { name: { type: 'string' } } } },
          },
        },
      },
      data,
      uischema: {
        type: 'Control',
        scope: '#/properties/a.b',
        options: {
          template: {
            type: 'Template',
            name: 'card',
            elements: [{ type: 'Control', scope: '#/properties/name', name: 'field' }],
          },
        },
      } as UISchemaElement,
      uischemas: [
        createRegistryEntry({
          type: 'VerticalLayout',
          name: 'card',
          elements: [{ type: 'Slot', name: 'field' }],
        } as unknown as UISchemaElement),
      ],
      renderers: [
        templateRendererEntry,
        slotRendererEntry,
        verticalLayoutRendererEntry,
        {
          tester: (ui) => (ui.type === 'Control' && ui.options?.template ? 100 : -1),
          renderer: NestedTemplateHost,
        },
        { tester: (ui) => (ui.type === 'Control' ? 1 : -1), renderer: TemplateField },
      ],
      onchange,
    },
  });
  const input = view.getByRole('textbox', { name: 'Name' });
  await expect.poll(() => (input.query() as HTMLInputElement | null)?.value).toBe('Original');
  await input.fill('Changed');
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({
      'a.b': { name: 'Changed' },
      a: { b: { name: 'Nested lookalike' } },
    });
  await view.rerender({ data: { ...data, 'a.b': { name: 'Imported' } } });
  await expect.poll(() => (input.query() as HTMLInputElement | null)?.value).toBe('Imported');
});

it('reuses a named template at successive data paths and stops at an absent child', async () => {
  const data = { tree: { name: 'Root', child: { name: 'Child' } } };
  const onchange = vi.fn();
  const nodeTemplate = { type: 'Template', name: 'node' };
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        definitions: {
          node: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              child: { $ref: '#/definitions/node' },
            },
          },
        },
        properties: { tree: { $ref: '#/definitions/node' } },
      },
      data,
      uischema: {
        type: 'Control',
        scope: '#/properties/tree',
        options: { template: nodeTemplate },
      } as UISchemaElement,
      uischemas: [
        createRegistryEntry({
          type: 'VerticalLayout',
          name: 'node',
          elements: [
            { type: 'Control', scope: '#/properties/name' },
            {
              type: 'Control',
              scope: '#/properties/child',
              options: { template: nodeTemplate },
            },
          ],
        } as unknown as UISchemaElement),
      ],
      renderers: [
        templateRendererEntry,
        verticalLayoutRendererEntry,
        {
          tester: (ui) => (ui.type === 'Control' && ui.options?.template ? 100 : -1),
          renderer: NestedTemplateHost,
        },
        { tester: (ui) => (ui.type === 'Control' ? 1 : -1), renderer: TemplateField },
      ],
      onchange,
    },
  });
  const inputs = () =>
    Array.from(view.container.querySelectorAll<HTMLInputElement>('input[aria-label="Name"]'));
  await expect.poll(() => inputs().map((input) => input.value)).toEqual(['Root', 'Child']);
  inputs()[1].value = 'Edited';
  inputs()[1].dispatchEvent(new Event('input', { bubbles: true }));
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({
      tree: { name: 'Root', child: { name: 'Edited' } },
    });
  await view.rerender({ data: { tree: { name: 'Only root' } } });
  await expect.poll(() => inputs().map((input) => input.value)).toEqual(['Only root']);
});
