import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { monacoControlRendererEntry } from '../../src/lib/controls';
import { mountControl } from '../testUtils';

afterEach(cleanup);

it('uses flat dimensions, local overrides, and ignores removed namespaced dimensions', async () => {
  const { view } = await mountControl({
    renderers: [monacoControlRendererEntry],
    propertySchema: { type: 'string' },
    value: 'const size = true;',
    options: { format: 'code', language: 'javascript' },
    config: { width: 360, height: 180, jsonformsExtended: { width: 700, height: 700 } },
  });
  const editor = view.container.querySelector<HTMLElement>('.jsonforms-monaco-editor');
  expect(editor).not.toBeNull();
  await expect.poll(() => editor?.getBoundingClientRect().width).toBe(360);
  await expect.poll(() => editor?.getBoundingClientRect().height).toBe(180);
  await view.rerender({
    uischema: {
      type: 'Control',
      scope: '#/properties/value',
      options: { format: 'code', language: 'javascript', width: '240px', height: '12rem' },
    },
  });
  await expect.poll(() => editor?.getBoundingClientRect().width).toBe(240);
  await expect.poll(() => editor?.getBoundingClientRect().height).toBe(192);
});
