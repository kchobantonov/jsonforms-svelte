import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { createTranslator, RuleEffect, type UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { linkRendererEntry } from '../../src/lib/layouts';

afterEach(cleanup);
const mount = async (href: string, config = {}, extra = {}) =>
  await render(JsonForms, {
    props: {
      data: {},
      schema: { type: 'object' },
      config,
      uischema: { type: 'Link', label: 'Help', href, ...extra } as UISchemaElement,
      renderers: [linkRendererEntry],
    },
  });

it('uses the native anchor semantics with safe new-window attributes', async () => {
  const view = await mount('https://example.com', {}, { target: '_blank', rel: 'external' });
  const link = view.container.querySelector('a');
  expect(link?.textContent).toBe('Help');
  expect(link?.getAttribute('href')).toBe('https://example.com');
  expect(link?.getAttribute('rel')).toBe('external noopener noreferrer');
});
it.each(['', '   ', 'javascript:alert(1)', '//example.com'])(
  'retains inert text for %j',
  async (href) => {
    const view = await mount(href);
    expect(view.container.querySelector('a')).toBeNull();
    expect(view.container.querySelector('[data-link-inert]')?.textContent).toBe('Help');
  },
);
it('applies reactive host URL policy and keeps empty translated labels', async () => {
  const view = await mount('/help');
  expect(view.container.querySelector('a')).not.toBeNull();
  await view.rerender({
    config: { jsonformsExtended: { security: { urlPolicy: { allowRelative: false } } } },
  });
  expect(view.container.querySelector('a')).toBeNull();
  await view.rerender({
    uischema: {
      type: 'Link',
      label: 'Help',
      href: 'https://example.com',
      i18n: 'help',
    } as UISchemaElement,
    i18n: {
      locale: 'bg',
      translate: createTranslator((key, fallback) => (key === 'help.label' ? 'Помощ' : fallback)),
    },
  });
  expect(view.container.querySelector('a')?.textContent).toBe('Помощ');
  await view.rerender({ i18n: { locale: 'bg', translate: createTranslator(() => '') } });
  expect(view.container.querySelector('a')?.textContent).toBe('');
});
it('uses href as the unlabelled fallback and respects visibility rules', async () => {
  const view = await mount('https://example.com', {}, { label: undefined });
  expect(view.container.querySelector('a')?.textContent).toBe('https://example.com');
  await view.rerender({
    uischema: {
      type: 'Link',
      href: 'https://example.com',
      rule: { effect: RuleEffect.HIDE, condition: { scope: '#', schema: {} } },
    } as UISchemaElement,
  });
  expect(view.container.querySelector('a, [data-link-inert]')).toBeNull();
});
