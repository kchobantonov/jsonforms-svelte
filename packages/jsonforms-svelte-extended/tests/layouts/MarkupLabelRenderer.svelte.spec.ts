import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { createTranslator, RuleEffect, type UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { markupLabelRendererEntry } from '../../src/lib/layouts';

afterEach(cleanup);
const mount = async (text: string, config = {}, locale = 'en', extra = {}) =>
  await render(JsonForms, {
    props: {
      data: {},
      schema: { type: 'object' },
      uischema: {
        type: 'Label',
        text,
        options: { markup: 'markdown' },
        ...extra,
      } as UISchemaElement,
      renderers: [markupLabelRendererEntry],
      config,
      i18n: { locale },
    },
  });

it('loads Markdown lazily and renders safe semantic elements', async () => {
  const view = await mount(
    '**Strong** and *emphasis* [Help](https://example.com)\n\n<img src=x onerror=alert(1)>',
  );
  await expect.poll(() => view.container.querySelector('strong')?.textContent).toBe('Strong');
  expect(view.container.querySelector('em')?.textContent).toBe('emphasis');
  expect(view.container.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  expect(view.container.querySelector('img')).toBeNull();
  expect(view.container.textContent).toContain('<img src=x onerror=alert(1)>');
});

it.each(['en', 'bg'])('retains refused link text and reports URL policy in %s', async (locale) => {
  const view = await mount('[Help](javascript:alert%281%29)', {}, locale);
  await expect
    .poll(() => view.container.querySelector('[data-markup-diagnostic="urlRefused"]')?.textContent)
    .toContain(locale === 'bg' ? 'Връзка е блокирана' : 'A link was blocked');
  expect(view.container.querySelector('a')).toBeNull();
  expect(view.container.textContent).toContain('Help');
});

it('preserves plain source and explains a disabled host policy', async () => {
  const view = await mount(
    '**Plain**',
    { jsonformsExtended: { markup: { markdown: { enabled: false } } } },
    'bg',
  );
  expect(view.container.querySelector('strong')).toBeNull();
  expect(view.container.textContent).toContain('**Plain**');
  expect(view.container.querySelector('[role="alert"]')?.textContent).toContain(
    'Markdown е изключен',
  );
});

it('uses the configured extended grammar and local typography option', async () => {
  const view = await mount(
    '# Heading',
    { jsonformsExtended: { markup: { markdown: { profile: 'extended' } } } },
    'en',
    { options: { markup: 'markdown', typography: false } },
  );
  await expect.poll(() => view.container.querySelector('h1')?.textContent).toBe('Heading');
  expect(view.container.querySelector('.typography')).toBeNull();
});

it('honors visibility rules before rendering markup or diagnostics', async () => {
  const view = await mount('Hidden', {}, 'en', {
    rule: { effect: RuleEffect.HIDE, condition: { scope: '#', schema: {} } },
  });
  expect(view.container.textContent).not.toContain('Hidden');
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
});

it('honors host translations for diagnostics', async () => {
  const view = await render(JsonForms, {
    props: {
      data: {},
      schema: { type: 'object' },
      uischema: {
        type: 'Label',
        text: '[Help](javascript:alert%281%29)',
        options: { markup: 'markdown' },
      } as UISchemaElement,
      renderers: [markupLabelRendererEntry],
      i18n: {
        locale: 'en',
        translate: createTranslator((key, fallback) =>
          key === 'markup.urlRefused' ? 'Host explanation' : fallback,
        ),
      },
    },
  });
  await expect
    .poll(() => view.container.querySelector('[role="alert"]')?.textContent)
    .toBe('Host explanation');
});
