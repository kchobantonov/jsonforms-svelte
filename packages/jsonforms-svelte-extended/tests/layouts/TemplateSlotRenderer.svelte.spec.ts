import {
  rankWith,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
  type JsonFormsUISchemaRegistryEntry,
  type JsonSchema,
  type UISchemaElement,
} from '@jsonforms/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
afterEach(async () => {
  await cleanup();
  vi.restoreAllMocks();
});
import { page } from 'vitest/browser';
import JsonForms from '../../src/lib/components/JsonForms.svelte';
import { slotRendererEntry, templateRendererEntry } from '../../src/lib/layouts';
import RecursiveLayoutRenderer from '../fixtures/RecursiveLayoutRenderer.svelte';
import TextRenderer from '../fixtures/TextRenderer.svelte';

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
  await vi.waitFor(() => expect(warning).toHaveBeenCalledWith('template.cycle: "first"'));
  expect(view.container.textContent?.match(/Independent content/g)).toHaveLength(2);
});
it('diagnoses missing and duplicate names, keeps first exact match and never evaluates testers', async () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
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
    },
  });
  await expect.element(page.getByText('First match', { exact: true })).toBeVisible();
  expect(view.container.textContent).not.toContain('Second match');
  expect(tester).not.toHaveBeenCalled();
  await vi.waitFor(() => expect(warning).toHaveBeenCalledWith('template.duplicate: "Card"'));
  await view.rerender({
    uischema: { type: 'Template', name: 'card' } as unknown as UISchemaElement,
  });
  await vi.waitFor(() => expect(warning).toHaveBeenCalledWith('template.missing: "card"'));
  expect(view.container.textContent).not.toContain('First match');
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
