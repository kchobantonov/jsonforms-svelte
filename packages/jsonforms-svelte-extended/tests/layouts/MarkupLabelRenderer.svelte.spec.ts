import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { RuleEffect, type UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { markupLabelRendererEntry } from '../../src/lib/layouts';

afterEach(cleanup);
const mount = async (
  text: string,
  config = {},
  locale = 'en',
  extra = {},
  ondiagnostic?: (diagnostic: unknown) => void,
) =>
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
      ondiagnostic,
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

it.each(['en', 'bg'])(
  'encodes data values inside authored Markdown link URLs in %s',
  async (locale) => {
    const view = await render(JsonForms, {
      props: {
        data: { slug: 'a/b?x=1&y=2' },
        schema: { type: 'object', properties: { slug: { type: 'string' } } },
        uischema: {
          type: 'Label',
          text: '[Open](https://example.com/items/{slug})',
          options: { markup: 'markdown', interpolate: true, textParams: { slug: '{data.slug}' } },
        } as UISchemaElement,
        renderers: [markupLabelRendererEntry],
        config: { jsonformsExtended: { dynamicValues: { enabled: true } } },
        i18n: { locale },
      },
    });
    await expect
      .poll(() => view.container.querySelector('a')?.getAttribute('href'))
      .toBe('https://example.com/items/a%2Fb%3Fx%3D1%26y%3D2');
    expect(view.container.querySelector('a')?.textContent).toBe('Open');
  },
);

it.each(['en', 'bg'])('retains refused link text and reports URL policy in %s', async (locale) => {
  const ondiagnostic = vi.fn();
  const view = await mount('[Help](javascript:alert%281%29)', {}, locale, {}, ondiagnostic);
  await vi.waitFor(() =>
    expect(ondiagnostic).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'markup.urlRefused', severity: 'warning' }),
    ),
  );
  expect(view.container.querySelector('a')).toBeNull();
  expect(view.container.textContent).toContain('Help');
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
});

it('reports markup and URL refusals to authors without logging link values', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const codes = () => warn.mock.calls.map(([code]) => code);
  try {
    const ondiagnostic = vi.fn();
    const disabled = await mount(
      '**Plain**',
      {
        jsonformsExtended: { markup: { markdown: { enabled: false } } },
      },
      'en',
      {},
      ondiagnostic,
    );
    await vi.waitFor(() => expect(codes()).toContain('markup.markdownDisabled'));
    expect(disabled.container.textContent).toContain('**Plain**');
    await disabled.rerender({ data: { changed: true } });
    expect(codes().filter((code) => code === 'markup.markdownDisabled')).toHaveLength(1);
    await disabled.rerender({
      config: { jsonformsExtended: { markup: { markdown: { enabled: true } } } },
    });
    await vi.waitFor(() => expect(disabled.container.querySelector('strong')).not.toBeNull());
    await disabled.rerender({
      config: { jsonformsExtended: { markup: { markdown: { enabled: false } } } },
    });
    await vi.waitFor(() =>
      expect(
        ondiagnostic.mock.calls.filter(
          ([diagnostic]) => diagnostic.code === 'markup.markdownDisabled',
        ),
      ).toHaveLength(2),
    );
    await cleanup();

    const unsupported = await mount('Readable', {}, 'en', {
      options: { markup: 'unknown' },
    });
    await vi.waitFor(() => expect(codes()).toContain('markup.unsupported'));
    expect(unsupported.container.textContent).toContain('Readable');
    await cleanup();

    const refused = await mount('[Help](javascript:alert%281%29)');
    await vi.waitFor(() => expect(codes()).toContain('markup.urlRefused'));
    expect(refused.container.querySelector('a')).toBeNull();
    expect(warn.mock.calls.filter(([code]) => String(code).startsWith('markup.'))).toHaveLength(4);
    expect(JSON.stringify(warn.mock.calls)).not.toContain('javascript:');
  } finally {
    warn.mockRestore();
  }
});

it('preserves plain source and reports a disabled host policy only to authors', async () => {
  const ondiagnostic = vi.fn();
  const view = await mount(
    '**Plain**',
    { jsonformsExtended: { markup: { markdown: { enabled: false } } } },
    'bg',
    {},
    ondiagnostic,
  );
  expect(view.container.querySelector('strong')).toBeNull();
  expect(view.container.textContent).toContain('**Plain**');
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
  expect(ondiagnostic).toHaveBeenCalledWith(
    expect.objectContaining({ code: 'markup.markdownDisabled', severity: 'warning' }),
  );
});

it('uses the configured extended grammar and local typography option', async () => {
  const view = await mount(
    '# Heading\n\n- One item\n\n[Help](https://example.com)',
    { jsonformsExtended: { markup: { markdown: { profile: 'extended' } } } },
    'en',
    { options: { markup: 'markdown', typography: false } },
  );
  await expect.poll(() => view.container.querySelector('h1')?.textContent).toBe('Heading');
  expect(view.container.querySelector('.typography')).toBeNull();
  const list = view.container.querySelector('ul');
  const link = view.container.querySelector('a');
  expect(list).not.toBeNull();
  expect(link).not.toBeNull();
  expect(getComputedStyle(list!).listStyleType).toBe('disc');
  expect(getComputedStyle(link!).textDecorationLine).toContain('underline');
  expect(
    Number(getComputedStyle(view.container.querySelector('h1')!).fontWeight),
  ).toBeGreaterThanOrEqual(600);
});

it('honors visibility rules before rendering markup or diagnostics', async () => {
  const view = await mount('Hidden', {}, 'en', {
    rule: { effect: RuleEffect.HIDE, condition: { scope: '#', schema: {} } },
  });
  expect(view.container.textContent).not.toContain('Hidden');
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
});

it('keeps URL-policy author warnings out of form content', async () => {
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
    },
  });
  await vi.waitFor(() => expect(view.container.textContent).toContain('Help'));
  expect(view.container.querySelector('[role="alert"]')).toBeNull();
});
