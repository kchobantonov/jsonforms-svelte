import '../test.css';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as stringMaskControlRendererEntry } from '../../src/lib/controls/StringMaskControlRenderer.entry';
import { mountControl } from '../testUtils';

afterEach(cleanup);

it.each([
  { name: 'string', renderer: stringControlRendererEntry, value: 'Ada', options: {} },
  {
    name: 'masked',
    renderer: stringMaskControlRendererEntry,
    value: '482913',
    options: { mask: '###-###' },
  },
])(
  'keeps the $name clear button before its end adornment',
  async ({ renderer, value, options }) => {
    const { view } = await mountControl({
      renderers: [renderer],
      propertySchema: { type: 'string' },
      value,
      options: {
        ...options,
        endAdornment: { kind: 'icon', icon: 'information', label: 'Help' },
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
    input.focus();
    const clear = view.container.querySelector<HTMLButtonElement>(
      'button[aria-label="Clear value"]',
    )!;
    const adornment = view.container.querySelector<HTMLElement>('[data-adornment="end"]')!;
    await expect
      .poll(() => adornment.getBoundingClientRect().left - clear.getBoundingClientRect().right)
      .toBeGreaterThanOrEqual(2);
  },
);

it('shows the full adornment tooltip beyond the field wrapper on focus', async () => {
  const { view } = await mountControl({
    renderers: [stringControlRendererEntry],
    propertySchema: { type: 'string' },
    value: 'Ada',
    options: {
      endAdornment: {
        kind: 'icon',
        icon: 'information',
        label: 'Help',
        tooltip: 'About this value',
      },
    },
  });
  const frame = view.container.querySelector<HTMLElement>('[data-input-adornments]')!;
  const wrapper = frame.parentElement!;
  const adornment = frame.querySelector<HTMLButtonElement>('[data-adornment="end"]')!;
  const tooltip = adornment.querySelector<HTMLElement>('[role="tooltip"]')!;
  adornment.focus();
  expect(getComputedStyle(wrapper).overflow).toBe('visible');
  await expect.poll(() => tooltip.getBoundingClientRect().height).toBeGreaterThan(20);
  expect(tooltip.getBoundingClientRect().bottom).toBeGreaterThan(
    wrapper.getBoundingClientRect().bottom,
  );
});
