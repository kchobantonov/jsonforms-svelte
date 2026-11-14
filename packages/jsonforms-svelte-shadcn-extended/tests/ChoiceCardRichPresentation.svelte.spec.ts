import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema7, UISchemaElement } from '@jsonforms/core';
import { shadcnRenderers } from '@chobantonov/jsonforms-svelte-shadcn';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import { shadcnExtendedRenderers } from '../src/lib';
import fixtureSchema from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/schema.json';
import fixtureUi from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/uischema.json';
import fixtureData from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/data.json';
import fixtureConfig from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/config.json';
import fixtureTranslations from '@chobantonov/jsonforms-extended-spec/examples/choice-controls/translations.json';
import { createTranslator } from '../../jsonforms-svelte-demo-common/src/lib/i18n/i18n';
import './test.css';

afterEach(cleanup);

it('keeps a broken-image card selectable and replaces its rich content on host update', async () => {
  const uischema = {
    type: 'Control',
    scope: '#',
    options: {
      format: 'cards',
      choices: [
        {
          value: 'A',
          label: 'Image choice',
          selectedContent: {
            type: 'VerticalLayout',
            elements: [
              { type: 'ImageView', src: 'https://127.0.0.1:1/missing-card-image.png', alt: '' },
              { type: 'Label', text: 'Selected content' },
            ],
          },
        },
        { value: 'B', label: 'Other choice' },
      ],
    },
  };
  const props = {
    schema: { type: 'string', enum: ['A', 'B'] },
    data: 'A',
    uischema,
    renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
  };
  const view = await render(JsonForms, { props });
  const radio = page.getByRole('radio', { name: 'Image choice', exact: true });
  await expect.element(radio).toBeChecked();
  const card = radio.query()!.closest('label, .card')!;
  const brokenImage = card.querySelector('img')!;
  await vi.waitFor(() => expect(brokenImage.complete).toBe(true));
  expect(brokenImage.naturalWidth).toBe(0);
  expect(card.textContent).toContain('Selected content');
  expect(card.textContent).toContain('Image choice');

  await view.rerender({
    ...props,
    uischema: {
      ...uischema,
      options: {
        ...uischema.options,
        choices: [
          {
            value: 'A',
            label: 'Image choice',
            selectedContent: { type: 'Label', text: 'Replacement content' },
          },
          { value: 'B', label: 'Other choice' },
        ],
      },
    },
  });
  await vi.waitFor(() => expect(card.textContent).toContain('Replacement content'));
  expect(card.querySelector('img')).toBeNull();
  await expect.element(radio).toBeChecked();
});

type ExampleNode = UISchemaElement & { scope?: string; elements?: ExampleNode[] };
function findControl(node: ExampleNode, scope: string): ExampleNode | undefined {
  if (node.type === 'Control' && node.scope === scope) return node;
  return node.elements?.map((element) => findControl(element, scope)).find(Boolean);
}

it.each(['en', 'bg'] as const)(
  'keeps the selected image-card label and markup when image data is blocked in %s',
  async (locale) => {
    const uischema = findControl(fixtureUi as ExampleNode, '#/properties/cardDecision')!;
    const props = {
      schema: fixtureSchema as unknown as JsonSchema7,
      uischema,
      data: fixtureData,
      config: fixtureConfig as Record<string, unknown>,
      i18n: { locale, translate: createTranslator(locale, fixtureTranslations) },
      renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
    };
    const view = await render(JsonForms, { props });
    const name = fixtureTranslations[locale]['cards.approve.label'];
    const radio = page.getByRole('radio', { name, exact: true });
    await expect.element(radio).toBeChecked();
    const card = radio.query()!.closest('label')!;
    expect(card.textContent).toContain(name);
    await vi.waitFor(() =>
      expect(card.querySelector('strong')?.textContent).toContain(
        locale === 'en' ? 'Approved' : 'Одобрено',
      ),
    );
    expect(
      [...card.querySelectorAll('img')].some(
        (image) =>
          image.src.startsWith('data:image/') && getComputedStyle(image).visibility !== 'hidden',
      ),
    ).toBe(true);

    await view.rerender({
      ...props,
      config: { jsonformsExtended: { security: { urlPolicy: { allowImageDataUrls: false } } } },
    });
    await vi.waitFor(() =>
      expect(
        [...card.querySelectorAll('img')].some((image) => image.src.startsWith('data:image/')),
      ).toBe(false),
    );
    expect(card.textContent).toContain(name);
    await vi.waitFor(() =>
      expect(card.querySelector('strong')?.textContent).toContain(
        locale === 'en' ? 'Approved' : 'Одобрено',
      ),
    );
    await expect.element(radio).toBeChecked();
  },
);

it('falls back to the choice label for an interpolated card layout', async () => {
  await render(JsonForms, {
    props: {
      schema: { enum: ['safe'] },
      data: 'safe',
      config: { jsonformsExtended: { dynamicValues: { enabled: true } } },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          format: 'cards',
          choices: [
            {
              value: 'safe',
              label: 'Safe choice',
              content: {
                type: 'VerticalLayout',
                elements: [
                  {
                    type: 'Label',
                    text: 'Generated {secret}',
                    options: {
                      interpolate: true,
                      textParams: { secret: 'Visible from interpolation' },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
    },
  });
  const radio = page.getByRole('radio', { name: 'Safe choice', exact: true });
  await expect.element(radio).toBeChecked();
  const card = radio.query()!.closest('label')!;
  await new Promise((resolve) => setTimeout(resolve, 150));
  expect(card.textContent).toContain('Safe choice');
  expect(card.textContent).not.toContain('Generated');
  expect(card.textContent).not.toContain('Visible from interpolation');
});
