import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { durationControlRendererEntry } from '../../src/lib/controls';
import { expectLabelVisible, mountControl, waitForChange } from '../testUtils';

describe('DurationControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(() => {
    cleanup();
  });

  const renderers = [durationControlRendererEntry];
  const propertySchema: JsonSchema = {
    type: 'string',
    format: 'duration',
    title: 'Duration',
  };

  it('renders duration input when no data is provided', () => {
    const { view } = mountControl({
      renderers,
      propertySchema,
      options: { placeholder: 'Enter duration' },
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="text"][id$="-input"]',
    );
    expect(input).toBeTruthy();
    expect(input?.value).toBe('');
    expect(input?.getAttribute('placeholder')).toBe('Enter duration');
    expectLabelVisible(view.container, 'Duration');
  });

  it('updates core data on valid duration input', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      value: 'P1D',
    });

    const input = view.container.querySelector<HTMLInputElement>(
      'input[type="text"][id$="-input"]',
    );
    expect(input).toBeTruthy();
    expect(input?.value).toBe('P1D');

    const before = onchange.mock.calls.length;
    input!.value = 'P2DT3H';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('P2DT3H');
  });

  it('updates core data via duration picker fields when actions are disabled', async () => {
    const { view, onchange } = mountControl({
      renderers,
      propertySchema,
      options: { showActions: false },
    });

    const menuButton = view.container.querySelector<HTMLButtonElement>('button[id$="-menu"]');
    expect(menuButton).toBeTruthy();
    menuButton!.click();

    await vi.waitFor(() => {
      expect(view.container.querySelectorAll('input[type="number"]').length).toBeGreaterThan(0);
    });

    const numberInputs = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="number"]'),
    );
    const weeksInput = numberInputs[0];
    expect(weeksInput).toBeTruthy();

    const before = onchange.mock.calls.length;
    weeksInput.value = '2';
    weeksInput.dispatchEvent(new Event('input', { bubbles: true }));
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('P2W');
  });
});
