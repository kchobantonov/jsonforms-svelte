import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { labelRendererEntry } from '@chobantonov/jsonforms-svelte-shadcn';
import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { markupLabelRendererEntry } from '../../src/lib/layouts';
import '../test.css';

afterEach(cleanup);

const mount = (
  options: Record<string, unknown>,
  text: string,
  renderers: JsonFormsRendererRegistryEntry[] = [markupLabelRendererEntry],
) =>
  render(JsonForms, {
    props: {
      data: {},
      schema: { type: 'object' },
      uischema: { type: 'Label', text, options },
      config: { jsonformsExtended: { markup: { markdown: { profile: 'extended' } } } },
      renderers,
    },
  });

it('uses family typography for plain text and a block-safe wrapper for Markdown', async () => {
  const plain = await mount({ interpolate: true }, 'Plain label');
  expect(plain.container.querySelector('p.text-foreground')?.textContent).toContain('Plain label');
  await plain.unmount();

  const markdown = await mount({ markup: 'markdown' }, '# Heading\n\n- Item');
  await expect.poll(() => markdown.container.querySelector('h1')?.textContent).toBe('Heading');
  expect(markdown.container.querySelector('div.text-foreground .markup-content')).not.toBeNull();
  expect(markdown.container.querySelector('p h1')).toBeNull();
  await markdown.unmount();

  const bare = await mount({ markup: 'markdown', typography: false }, '# Heading\n\n- Item');
  await expect.poll(() => bare.container.querySelector('h1')?.textContent).toBe('Heading');
  expect(bare.container.querySelector('.text-foreground')).toBeNull();
  expect(bare.container.querySelector('ul')).not.toBeNull();
});

it('matches ordinary Label text styling for plain and Markdown wrappers', async () => {
  const base = await mount({}, 'Base label', [labelRendererEntry]);
  const baseLabel = base.container.querySelector('p.text-foreground');
  expect(baseLabel).not.toBeNull();
  const baseline = getComputedStyle(baseLabel!);
  const expected = [baseline.color, baseline.fontSize, baseline.fontWeight];
  await base.unmount();

  const plain = await mount({ interpolate: true }, 'Plain label');
  const plainStyle = getComputedStyle(plain.container.querySelector('p.text-foreground')!);
  expect([plainStyle.color, plainStyle.fontSize, plainStyle.fontWeight]).toEqual(expected);
  await plain.unmount();

  const markdown = await mount({ markup: 'markdown' }, '**Markdown**');
  await expect.poll(() => markdown.container.querySelector('strong')?.textContent).toBe('Markdown');
  const blockStyle = getComputedStyle(markdown.container.querySelector('div.text-foreground')!);
  expect([blockStyle.color, blockStyle.fontSize, blockStyle.fontWeight]).toEqual(expected);
});

it('matches ordinary Label color in dark mode', async () => {
  const wasDark = document.documentElement.classList.contains('dark');
  document.documentElement.classList.add('dark');
  try {
    const base = await mount({}, 'Base label', [labelRendererEntry]);
    const baseLabel = base.container.querySelector('p.text-foreground');
    expect(baseLabel).not.toBeNull();
    const expected = getComputedStyle(baseLabel!).color;
    await base.unmount();

    const plain = await mount({ interpolate: true }, 'Plain label');
    expect(getComputedStyle(plain.container.querySelector('p.text-foreground')!).color).toBe(
      expected,
    );
    await plain.unmount();

    const markdown = await mount({ markup: 'markdown' }, '**Markdown**');
    await expect
      .poll(() => markdown.container.querySelector('strong')?.textContent)
      .toBe('Markdown');
    expect(getComputedStyle(markdown.container.querySelector('div.text-foreground')!).color).toBe(
      expected,
    );
  } finally {
    document.documentElement.classList.toggle('dark', wasDark);
  }
});
