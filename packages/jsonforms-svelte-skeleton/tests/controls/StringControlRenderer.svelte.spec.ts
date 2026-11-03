import { tick } from 'svelte';
import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as stringControlRendererEntry } from '../../src/lib/controls/StringControlRenderer.entry';
import {
  expectLabelVisible,
  expectValidationError,
  getBySelector,
  mountControl,
  waitForChange,
} from '../testUtils';

describe('StringControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [stringControlRendererEntry];

  it('links focused description to the input while preserving an authored description', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', title: 'Name', description: 'Helpful description' },
      options: { skeleton: { input: { 'aria-describedby': 'author-help' } } },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.getAttribute('aria-describedby')).toBe('author-help');
    input.focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Helpful description');
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
    input.blur();
    await tick();
    expect(input.getAttribute('aria-describedby')).toBe('author-help');
  });

  it('does not reference a helper when the control wrapper is hidden', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', description: 'Hidden wrapper help' },
      options: { hideControlWrapper: true, showUnfocusedDescription: true },
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.getAttribute('aria-describedby')).toBeNull();
    expect(view.container.querySelector('[id$="-help"]')).toBeNull();
    const hiddenLabel = view.container.querySelector<HTMLLabelElement>('label.sr-only');
    expect(hiddenLabel?.htmlFor).toBe(input.id);
    expect(Array.from(input.labels ?? [])).toContain(hiddenLabel);
    expect(hiddenLabel?.textContent?.trim()).toBeTruthy();
  });

  it('renders empty input when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', title: 'My String' },
      options: { placeholder: 'string placeholder' },
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('');
    expect(input.getAttribute('placeholder')).toBe('string placeholder');
    expectLabelVisible(view.container, 'My String');
  });

  it('uses flat and local focus only on initial mount without reclaiming focus', async () => {
    const propertySchema = { type: 'string', title: 'Name' };
    const optedOut = await mountControl({
      renderers,
      propertySchema,
      config: { focus: true },
      options: { focus: false },
      value: 'Ada',
    });
    const optedOutInput = getBySelector<HTMLInputElement>(
      optedOut.view.container,
      'input[type="text"]',
    );
    expect(document.activeElement).not.toBe(optedOutInput);
    await optedOut.view.rerender({
      uischema: { type: 'Control', scope: '#/properties/value', options: { focus: true } },
    });
    expect(document.activeElement).not.toBe(optedOutInput);
    await optedOut.view.unmount();

    const globallyFocused = await mountControl({
      renderers,
      propertySchema,
      config: { focus: true },
      value: 'Ada',
    });
    const input = getBySelector<HTMLInputElement>(
      globallyFocused.view.container,
      'input[type="text"]',
    );
    await expect.poll(() => document.activeElement).toBe(input);
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    await globallyFocused.view.rerender({ data: { value: 'Byron' } });
    expect(document.activeElement).toBe(outside);
    outside.remove();
    await globallyFocused.view.unmount();

    const locallyFocused = await mountControl({
      renderers,
      propertySchema,
      config: { focus: false },
      options: { focus: true },
      value: 'Ada',
    });
    const localInput = getBySelector<HTMLInputElement>(
      locallyFocused.view.container,
      'input[type="text"]',
    );
    await expect.poll(() => document.activeElement).toBe(localInput);
  });

  it('focuses a separate readonly input without enabling edits', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      config: { focus: true, readonly: true, separateReadonlyFromDisabled: true },
      value: 'Ada',
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    await expect.poll(() => document.activeElement).toBe(input);
    expect(input.readOnly).toBe(true);
    expect(input.disabled).toBe(false);
  });

  it('updates core data on input', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string' },
      value: 'a',
    });

    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    expect(input.value).toBe('a');
    const before = onchange.mock.calls.length;
    input.value = 'b';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('b');
  });

  it('renders validation error for invalid value', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', minLength: 3 },
      value: 'ab',
      required: true,
    });

    expectValidationError(view.container);
  });

  it('commits a pending edit on blur before navigation removes the control', async () => {
    const { view, onchange } = await mountControl({
      renderers: [stringControlRendererEntry],
      propertySchema: { type: 'string' },
      value: 'before',
    });
    const input = getBySelector<HTMLInputElement>(view.container, 'input[type="text"]');
    input.value = 'after';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('blur'));
    await tick();
    expect(onchange.mock.lastCall?.[0].data.value).toBe('after');
  });
});
