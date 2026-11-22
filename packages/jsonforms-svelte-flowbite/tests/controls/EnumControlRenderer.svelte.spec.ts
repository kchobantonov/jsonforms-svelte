import { tick } from 'svelte';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as enumControlRendererEntry } from '../../src/lib/controls/EnumControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('EnumControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [enumControlRendererEntry];

  it('places the native choice chevron before the end adornment', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['standard', 'premium'] },
      value: 'standard',
      options: { endAdornment: { kind: 'icon', icon: 'information', label: 'Help' } },
    });
    const frame = view.container.querySelector<HTMLElement>('[data-input-adornments]')!;
    const select = frame.querySelector<HTMLSelectElement>('select')!;
    const control = frame.querySelector<HTMLElement>('.jf-adorned-input-control')!;
    const adornment = frame.querySelector<HTMLElement>('[data-adornment="end"]')!;
    await expect.poll(() => getComputedStyle(select).appearance).toBe('none');
    const chevron = getComputedStyle(control, '::after');
    expect(chevron.content).not.toBe('none');
    const chevronRight = control.getBoundingClientRect().right - parseFloat(chevron.insetInlineEnd);
    expect(chevronRight).toBeLessThan(adornment.getBoundingClientRect().left);
  });

  it.each([false, true])('associates visible help for autocomplete=%s', async (autocomplete) => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B'], description: 'Choice help' },
      options: { autocomplete, flowbite: { Select: { 'aria-describedby': 'author-help' } } },
    });
    const input = view.container.querySelector<HTMLElement>('[id$="-input"]');
    expect(input).toBeTruthy();
    input?.focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Choice help');
    expect(input?.getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
    expect(input?.getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
  });

  it.each([false, true])(
    'keeps an imported value visible for autocomplete=%s',
    async (autocomplete) => {
      const { view } = await mountControl({
        renderers,
        propertySchema: { type: 'string', enum: ['A', 'B'] },
        value: 'outside',
        options: { autocomplete },
      });
      const status = view.container.querySelector<HTMLElement>('[id$="-invalid-value"]');
      expect(status?.textContent).toContain('"outside"');
      expect(status?.textContent).toContain('Current value outside the choices');
      const input = view.container.querySelector<HTMLElement>('[id$="-input"]');
      expect(input?.getAttribute('aria-describedby')?.split(' ')).toContain(status?.id);
      expect(view.container.querySelector('[aria-invalid="true"]')).toBeTruthy();
    },
  );

  it('renders select when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'], title: 'Choice' },
    });

    const select = getBySelector<HTMLSelectElement>(view.container, 'select[id$="-input"]');
    expect(select.options.length).toBeGreaterThan(0);
    expect(select.value).toBe('');
    expectLabelVisible(view.container, 'Choice');
  });

  it('updates core data on selection change', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      value: 'A',
    });

    const select = getBySelector<HTMLSelectElement>(view.container, 'select[id$="-input"]');
    expect(select.selectedOptions[0].textContent).toBe('A');
    const before = onchange.mock.calls.length;
    select.value = Array.from(select.options).find((option) => option.textContent === 'B')!.value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('B');
  });

  it('renders validation error when required data is missing', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      required: true,
    });

    expectValidationError(view.container);
  });
});
