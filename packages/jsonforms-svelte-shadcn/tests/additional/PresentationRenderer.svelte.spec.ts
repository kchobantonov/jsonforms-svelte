import { shadcnRenderers } from '../../src/lib/renderers';
import { page, userEvent } from 'vite-plus/test/browser';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import '../test.css';
import { JsonForms, type ImageViewElement } from '@chobantonov/jsonforms-svelte';
import {
  RuleEffect,
  type UISchemaElement,
  type Translator,
  type JsonSchema,
} from '@jsonforms/core';
import { afterEach, describe, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { additionalRenderers } from '../../src/lib/additional';
import { mountForm } from '../testUtils';
afterEach(cleanup);
describe('presentation renderers', () => {
  it('renders a separator', async () => {
    const { view } = await mountForm({
      schema: {},
      uischema: { type: 'Separator' },
      renderers: additionalRenderers,
    });
    expect(view.container.querySelector('hr, [data-slot="separator"]')).not.toBeNull();
  });
  it('uses default and explicit spacer heights', async () => {
    const first = await mountForm({
      schema: {},
      uischema: { type: 'Spacer' },
      renderers: additionalRenderers,
    });
    expect(first.view.container.querySelector('[style*="height: 32px"]')).not.toBeNull();
    const second = await mountForm({
      schema: {},
      uischema: { type: 'Spacer', options: { height: 64 } },
      renderers: additionalRenderers,
    });
    expect(second.view.container.querySelector('[style*="height: 64px"]')).not.toBeNull();
  });
  it('uses image source and alternative text and honors visibility rules', async () => {
    const { view } = await mountForm({
      schema: {},
      uischema: {
        type: 'ImageView',
        options: { src: '/example.png', alt: 'Example illustration' },
      },
      renderers: additionalRenderers,
    });
    expect(view.container.querySelector('img')?.getAttribute('src')).toBe('/example.png');
    expect(view.container.querySelector('img')?.getAttribute('alt')).toBe('Example illustration');
    const hidden = await mountForm({
      schema: {},
      data: {},
      uischema: {
        type: 'ImageView',
        options: { src: '/example.png' },
        rule: { effect: RuleEffect.HIDE, condition: { scope: '#', schema: {} } },
      },
      renderers: additionalRenderers,
    });
    expect(hidden.view.container.querySelector('img')).toBeNull();
  });
});

it('applies host URL policy before loading an image', async () => {
  for (const src of [
    'javascript:alert(1)',
    '//example.com/picture.png',
    'data:image/png;base64,AAAA',
  ]) {
    const { view } = await mountForm({
      schema: {},
      uischema: { type: 'ImageView', options: { src, alt: 'Illustration' } },
      renderers: additionalRenderers,
    });
    expect(view.container.querySelector('img')).toBeNull();
  }
});

it('uses top-level sources before scoped data, including explicit empty sources', async () => {
  for (const src of ['/top-level.png', '']) {
    const { view } = await mountForm({
      schema: { type: 'object', properties: { photo: { type: 'string' } } },
      data: { photo: '/scoped.png' },
      uischema: {
        type: 'ImageView',
        src,
        scope: '#/properties/photo',
        alt: '',
      } as ImageViewElement,
      renderers: additionalRenderers,
    });
    expect(view.container.querySelector('img')?.getAttribute('src')).toBe(src || undefined);
  }
});

it('updates a scoped image when its host data changes', async () => {
  const props = {
    schema: { type: 'object', properties: { photo: { type: 'string' } } },
    data: { photo: '/first.png' },
    uischema: { type: 'ImageView', scope: '#/properties/photo', alt: 'Photo' },
    renderers: additionalRenderers,
  };
  const view = await render(JsonForms, { props });
  expect(view.container.querySelector('img')?.getAttribute('src')).toBe('/first.png');
  await view.rerender({ ...props, data: { photo: '/second.png' } });
  expect(view.container.querySelector('img')?.getAttribute('src')).toBe('/second.png');
});

it.each(['en', 'bg'])(
  'localizes image policy diagnostics in %s and accepts host overrides',
  async (locale) => {
    const props = {
      schema: {},
      data: {},
      uischema: { type: 'ImageView', src: 'javascript:alert(1)', alt: '' },
      renderers: additionalRenderers,
      i18n: { locale },
    };
    const view = await render(JsonForms, { props });
    const message = view.container.querySelector('[data-image-diagnostic="image.urlRefused"]');
    expect(message?.querySelector('[data-image-summary]')?.textContent?.trim()).toBe(
      messages[locale as 'en' | 'bg']['image.blocked'],
    );
    const details = page.getByRole('button', {
      name: messages[locale as 'en' | 'bg']['image.warningDetails'],
    });
    const before = document.createElement('button');
    view.container.prepend(before);
    before.focus();
    await userEvent.tab();
    before.remove();
    await expect.element(details).toHaveFocus();
    await expect.element(page.getByRole('tooltip')).toBeVisible();
    await expect
      .element(page.getByRole('tooltip'))
      .toMatchTextContent(messages[locale as 'en' | 'bg']['image.urlRefused']);
    await userEvent.keyboard('{Escape}');
    await expect
      .poll(
        () =>
          [...document.querySelectorAll<HTMLElement>('[role="tooltip"]')].filter((element) =>
            element.checkVisibility(),
          ).length,
      )
      .toBe(0);
    await details.click();
    await expect.element(page.getByRole('tooltip')).toBeVisible();
    expect(view.container.querySelector('img')).toBeNull();
    await view.rerender({
      ...props,
      i18n: {
        locale,
        translate: ((key: string, fallback?: string) =>
          key === 'image.urlRefused' ? 'Host message' : fallback) as Translator,
      },
    });
    await expect.element(page.getByRole('tooltip')).toMatchTextContent('Host message');
    expect(view.container.textContent).not.toContain('javascript:');
  },
);

it('honors canonical Spacer size, including zero, ahead of legacy height', async () => {
  for (const [size, expected] of [
    [0, '0px'],
    ['2rem', '2rem'],
  ] as const) {
    const { view } = await mountForm({
      schema: {},
      renderers: additionalRenderers,
      uischema: { type: 'Spacer', size, options: { height: 64 } } as UISchemaElement,
    });
    const spacer = view.container.querySelector<HTMLElement>('[data-spacer]');
    expect(spacer?.style.height).toBe(expected);
    expect(spacer?.getAttribute('aria-hidden')).toBe('true');
    expect(spacer?.hasAttribute('tabindex')).toBe(false);
  }
});
it('allows a weighted Spacer to flex instead of imposing a fixed height', async () => {
  const { view } = await mountForm({
    schema: {},
    renderers: additionalRenderers,
    uischema: { type: 'Spacer', size: 0, options: { layout: { weight: 2 } } } as UISchemaElement,
  });
  const spacer = view.container.querySelector<HTMLElement>('[data-spacer]');
  expect(spacer?.style.flexGrow).toBe('2');
  expect(spacer?.style.flexShrink).toBe('1');
  expect(spacer?.style.height).toBe('');
});
it('renders an accessible static vertical separator within the supplied height', async () => {
  const { view } = await mountForm({
    schema: {},
    renderers: additionalRenderers,
    uischema: { type: 'Separator', options: { vertical: true } },
  });
  view.container.style.height = '80px';
  const separator = view.container.querySelector<HTMLElement>('hr, [role="separator"]');
  expect(separator?.getAttribute('aria-orientation')).toBe('vertical');
  expect(separator?.hasAttribute('tabindex')).toBe(false);
  expect(separator!.getBoundingClientRect().height).toBeGreaterThanOrEqual(79);
});

it('refreshes image alternative text from an arbitrary host locale and preserves decorative images', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: {},
      data: {},
      renderers: additionalRenderers,
      uischema: {
        type: 'ImageView',
        src: '/picture.png',
        alt: 'Fallback',
        i18n: 'picture',
      } as ImageViewElement,
    },
  });
  const translate = ((key: string, fallback?: string) =>
    key === 'picture.alt' ? 'Image personnalisée' : fallback) as Translator;
  await view.rerender({ i18n: { locale: 'fr-CA', translate } });
  expect(view.container.querySelector('img')?.alt).toBe('Image personnalisée');
  await view.rerender({
    uischema: {
      type: 'ImageView',
      src: '/picture.png',
      alt: '',
      i18n: 'picture',
    } as ImageViewElement,
  });
  expect(view.container.querySelector('img')?.alt).toBe('');
});

it.each(['en', 'bg'] as const)(
  'rejects a false image schema and refreshes after replacement in %s',
  async (locale) => {
    const data = {
      photo: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    };
    const onchange = vi.fn();
    const schema = (allowed: boolean) =>
      ({
        type: 'object',
        properties: { photo: allowed },
      }) as unknown as JsonSchema;
    const view = await render(JsonForms, {
      props: {
        schema: schema(false),
        data,
        onchange,
        renderers: additionalRenderers,
        uischema: {
          type: 'ImageView',
          scope: '#/properties/photo',
          alt: 'Sample',
        } as ImageViewElement,
        i18n: { locale },
        config: { jsonformsExtended: { security: { urlPolicy: { allowImageDataUrls: true } } } },
      },
    });
    expect(view.container.querySelector('img')).toBeNull();
    expect(
      view.container
        .querySelector('[data-image-diagnostic="image.scopeNotString"] [data-image-summary]')
        ?.textContent?.trim(),
    ).toBe(messages[locale]['image.configurationWarning']);
    await page.getByRole('button', { name: messages[locale]['image.warningDetails'] }).click();
    await expect
      .element(page.getByRole('tooltip'))
      .toMatchTextContent(messages[locale]['image.scopeNotString']);
    await view.rerender({ schema: schema(true) });
    await expect
      .poll(() => view.container.querySelector('img')?.getAttribute('src'))
      .toBe(data.photo);
    expect(view.container.querySelector('[data-image-diagnostic]')).toBeNull();
    expect(
      onchange.mock.calls.every(([event]) => JSON.stringify(event.data) === JSON.stringify(data)),
    ).toBe(true);
  },
);

it.each(['a.b', ''])('keeps the literal scoped image property %j reactive', async (key) => {
  const first = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { [key]: { type: 'string' } } },
      data: { [key]: first },
      renderers: additionalRenderers,
      uischema: {
        type: 'ImageView',
        scope: '#/properties/' + key.replaceAll('~', '~0').replaceAll('/', '~1'),
        alt: 'Sample',
      } as ImageViewElement,
      config: { jsonformsExtended: { security: { urlPolicy: { allowImageDataUrls: true } } } },
    },
  });
  expect(view.container.querySelector('img')?.getAttribute('src')).toBe(first);
  await view.rerender({ data: { [key]: '' } });
  expect(view.container.querySelector('img')).toBeNull();
  expect(view.container.querySelector('[data-image-diagnostic]')).toBeNull();
});

it.each([
  false,
  true,
  {},
  { type: ['string', 'null'] },
  { type: 'array', items: [{ type: 'string' }] },
])(
  'preserves scoped image layouts in the complete renderer registry for %j',
  async (propertySchema) => {
    const source = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    const keys = ['photo', 'a.b', '', 'a~b~c', '#'];
    const { view } = await mountForm({
      schema: {
        type: 'object',
        properties: Object.fromEntries(keys.map((key) => [key, propertySchema])),
      } as unknown as JsonSchema,
      data: Object.fromEntries(keys.map((key) => [key, source])),
      uischema: {
        type: 'VerticalLayout',
        elements: keys.map((key) => ({
          type: 'ImageView',
          scope: '#/properties/' + key.replaceAll('~', '~0').replaceAll('/', '~1'),
          alt: key,
        })),
      } as UISchemaElement,
      renderers: shadcnRenderers,
      config: { jsonformsExtended: { security: { urlPolicy: { allowImageDataUrls: true } } } },
    });
    const refused =
      propertySchema === false ||
      (typeof propertySchema === 'object' && propertySchema.type === 'array');
    await expect
      .poll(
        () =>
          view.container.querySelectorAll('[data-image-diagnostic="image.scopeNotString"]').length,
      )
      .toBe(refused ? keys.length : 0);
    await expect
      .poll(() => view.container.querySelectorAll('img').length)
      .toBe(refused ? 0 : keys.length);
    expect(view.container.querySelector('input')).toBeNull();
  },
);
