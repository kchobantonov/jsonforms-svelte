import { createTranslator, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import schema from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-label-interpolation/schema.json';
import uischema from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-label-interpolation/uischema.json';
import data from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-label-interpolation/data.json';
import config from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-label-interpolation/config.json';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-label-interpolation/translations.json';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers } from '@chobantonov/jsonforms-svelte-flowbite';
import { extendedLayoutRenderers } from '../../src/lib/layouts';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
import { afterEach, expect, it, vi } from 'vite-plus/test';

afterEach(cleanup);
it('renders rich card content without introducing interactive descendants', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { enum: ['basic', 'pro'] },
      data: 'basic',
      onchange,
      renderers: [...flowbiteRenderers, ...extendedLayoutRenderers],
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          format: 'cards',
          choices: [
            {
              value: 'basic',
              label: 'Basic',
              content: {
                type: 'Label',
                text: '**Simple** [Help](https://example.com) [Unsafe](javascript:alert%281%29)',
                options: { markup: 'markdown' },
              },
            },
            {
              value: 'pro',
              label: 'Pro',
              content: { type: 'Label', text: '*Advanced*', options: { markup: 'markdown' } },
            },
          ],
        },
      },
    },
  });
  await expect.poll(() => view.container.querySelector('strong')?.textContent).toBe('Simple');
  expect(view.container.querySelector('a')).toBeNull();
  expect(view.container.textContent).toContain('Unsafe');
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
  expect(view.container.querySelector('[inert]')?.getAttribute('aria-hidden')).toBe('true');
  await expect.element(page.getByRole('radio', { name: 'Basic', exact: true })).toBeChecked();
  await page.getByText('Pro', { exact: true }).click();
  await expect.poll(() => onchange.mock.lastCall?.[0].data).toBe('pro');
  await expect.element(page.getByRole('radio', { name: 'Pro', exact: true })).toBeChecked();

  await view.rerender({
    config: { jsonformsExtended: { markup: { markdown: { enabled: false } } } },
  });
  await expect.poll(() => view.container.textContent?.includes('*Advanced*')).toBe(true);
  expect(view.container.querySelector('em')).toBeNull();
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
});

it.each(['en', 'bg'] as const)('renders the spec interpolation example in %s', async (locale) => {
  const catalog = translations[locale] as Record<string, string>;
  const view = await render(JsonForms, {
    props: {
      schema: schema as JsonSchema,
      data,
      config,
      uischema: uischema as UISchemaElement,
      i18n: { locale, translate: createTranslator((key, fallback) => catalog[key] ?? fallback) },
      renderers: [...flowbiteRenderers, ...extendedLayoutRenderers],
    },
  });
  await expect
    .poll(() => view.container.textContent)
    .toContain(locale === 'bg' ? 'Абонирани сте за Atlas.' : 'You are subscribed to Atlas.');
  await expect
    .poll(() => view.container.textContent)
    .toContain(locale === 'bg' ? 'Планът ви включва 3 места.' : 'Your plan includes 3 seats.');
  await page.getByRole('tab', { name: 'Markdown', exact: true }).click();
  await expect
    .poll(
      () =>
        view.container
          .querySelector('a[href="https://example.com/billing"]')
          ?.closest('p')
          ?.querySelector('strong')?.textContent,
    )
    .toBe(locale === 'bg' ? 'първия работен ден' : 'first working day');
  expect(view.container.querySelector('a[href="https://example.com/billing"]')).not.toBeNull();
});

it('keeps a static interpolated label stable while an unrelated field changes', async () => {
  let productReads = 0;
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { seats: { type: 'integer' } } },
      data: { seats: 3 },
      config,
      renderers: [...flowbiteRenderers, ...extendedLayoutRenderers],
      uischema: {
        type: 'VerticalLayout',
        elements: [
          {
            type: 'Label',
            text: 'You are subscribed to {product}.',
            options: {
              interpolate: true,
              textParams: {
                get product() {
                  productReads += 1;
                  return 'Atlas';
                },
              },
            },
          },
          {
            type: 'Label',
            text: 'Your plan includes {seats} seats.',
            options: { interpolate: true, textParams: { seats: '{data.seats}' } },
          },
          { type: 'Control', scope: '#/properties/seats' },
        ],
      } as UISchemaElement,
    },
  });
  await expect.poll(() => view.container.textContent).toContain('You are subscribed to Atlas.');
  await expect.poll(() => view.container.textContent).toContain('Your plan includes 3 seats.');
  const productNode = [...view.container.querySelectorAll('span')].find(
    (node) => node.textContent === 'You are subscribed to Atlas.',
  );
  productReads = 0;
  await page.getByRole('spinbutton', { name: 'Seats' }).fill('4');
  await expect.poll(() => view.container.textContent).toContain('Your plan includes 4 seats.');
  expect(view.container.textContent).toContain('You are subscribed to Atlas.');
  expect(productNode?.isConnected).toBe(true);
  expect(
    [...view.container.querySelectorAll('span')].find(
      (node) => node.textContent === 'You are subscribed to Atlas.',
    ),
  ).toBe(productNode);
  expect(productReads).toBe(0);
});
