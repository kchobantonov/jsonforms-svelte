import { type JsonSchema } from '@jsonforms/core';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
import { entry as table } from '../../src/lib/complex/ArrayControlRenderer.entry';
import { entry as layout } from '../../src/lib/layouts/ArrayLayoutRenderer.entry';
import { entry as string } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as vertical } from '../../src/lib/layouts/LayoutRenderer.entry';
import { mountControl, waitForChange } from '../testUtils';

afterEach(cleanup);

const rendererNever = {
  jsonformsExtended: {
    confirmation: {
      default: 'always',
      renderers: { arrayTable: { delete: 'never' }, arrayLayout: { delete: 'never' } },
    },
  },
};

const scenarios: {
  name: string;
  policy?: string;
  item: string | { name?: string };
  prompt: boolean;
  config?: Record<string, unknown>;
}[] = [
  { name: 'complex skips a primitive', policy: 'complex', item: 'A', prompt: false },
  { name: 'always prompts for a primitive', policy: 'always', item: 'A', prompt: true },
  {
    name: 'complex prompts for a populated object',
    policy: 'complex',
    item: { name: 'Ada' },
    prompt: true,
  },
  { name: 'complex skips an empty object', policy: 'complex', item: {}, prompt: false },
  { name: 'never skips a populated object', policy: 'never', item: { name: 'Ada' }, prompt: false },
  {
    name: 'renderer config overrides the global default',
    item: { name: 'Ada' },
    prompt: false,
    config: rendererNever,
  },
  {
    name: 'local policy overrides renderer config',
    policy: 'always',
    item: { name: 'Ada' },
    prompt: true,
    config: rendererNever,
  },
];

for (const presentation of ['table', 'layout'] as const) {
  it.each(scenarios)(`${presentation}: $name`, async ({ policy, item, prompt, config }) => {
    const { view, onchange } = await mountControl({
      renderers: [table, layout, string, vertical],
      propertySchema: {
        type: 'array',
        items:
          typeof item === 'string'
            ? { type: 'string' }
            : { type: 'object', properties: { name: { type: 'string' } } },
      } as JsonSchema,
      options: {
        table: presentation === 'table',
        ...(policy ? { confirmation: { delete: policy } } : {}),
        pagination: false,
      },
      config,
      value: [item],
    });
    const bulkDelete = view.container.querySelector<HTMLButtonElement>('[data-delete-selected]');
    if (presentation === 'table' && bulkDelete) {
      view.container
        .querySelector<HTMLElement>(
          'tbody [data-row-selection] [role="checkbox"], tbody [data-row-selection] input[type="checkbox"]',
        )!
        .click();
      await expect.poll(() => bulkDelete.disabled).toBe(false);
      bulkDelete.click();
    } else {
      view.container
        .querySelector<HTMLButtonElement>('button[aria-label="Delete button"]')!
        .click();
    }
    const accept = page.getByRole('button', { name: 'Yes', exact: true });
    if (prompt) {
      await expect.element(accept).toBeVisible();
      const before = onchange.mock.calls.length;
      await accept.click();
      expect((await waitForChange(onchange, before)).data.value).toEqual([]);
      await expect.poll(() => accept.query()).toBeNull();
    } else {
      await expect.poll(() => onchange.mock.lastCall?.[0].data.value).toEqual([]);
      expect(accept.query()).toBeNull();
    }
  });
}

it.each([
  { name: 'only empty objects', values: [{}, {}], prompt: false },
  { name: 'one populated object', values: [{}, { name: 'Ada' }], prompt: true },
])('batch deletion checks $name under the complex policy', async ({ values, prompt }) => {
  const { view, onchange } = await mountControl({
    renderers: [table, layout, string, vertical],
    propertySchema: {
      type: 'array',
      items: { type: 'object', properties: { name: { type: 'string' } } },
    } as JsonSchema,
    options: { table: true, confirmation: { delete: 'complex' }, pagination: false },
    value: values,
  });
  view.container.querySelector<HTMLElement>('thead [role="checkbox"]')!.click();
  const bulkDelete = view.container.querySelector<HTMLButtonElement>('[data-delete-selected]')!;
  await expect.poll(() => bulkDelete.disabled).toBe(false);
  bulkDelete.click();
  const accept = page.getByRole('button', { name: 'Yes', exact: true });
  if (prompt) {
    await expect.element(accept).toBeVisible();
    const before = onchange.mock.calls.length;
    await accept.click();
    expect((await waitForChange(onchange, before)).data.value).toEqual([]);
  } else {
    await expect.poll(() => onchange.mock.lastCall?.[0].data.value).toEqual([]);
    expect(accept.query()).toBeNull();
  }
});
