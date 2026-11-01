import { page } from 'vite-plus/test/browser';
import { tick } from 'svelte';
import { clearAllIds, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as radioGroupControlRendererEntry } from '../../src/lib/controls/RadioGroupControlRenderer.entry';
import { entry as oneOfRadioGroupControlRendererEntry } from '../../src/lib/controls/OneOfRadioGroupControlRenderer.entry';
import { expectValidationError, mountControl, mountForm, waitForChange } from '../testUtils';

describe('RadioGroupControlRenderer', () => {
  beforeEach(() => {
    clearAllIds();
  });

  afterEach(async () => {
    await cleanup();
  });

  const renderers = [radioGroupControlRendererEntry];

  it.each([
    ['enum', radioGroupControlRendererEntry],
    ['oneOf', oneOfRadioGroupControlRendererEntry],
  ] as const)('resolves scoped radio orientation for %s', async (kind, entry) => {
    const property =
      kind === 'enum'
        ? { type: 'string', enum: ['A', 'B'] }
        : {
            type: 'string',
            oneOf: [
              { const: 'A', title: 'A' },
              { const: 'B', title: 'B' },
            ],
          };
    const schema = { type: 'object', properties: { value: property } } as JsonSchema;
    const uischema = (vertical?: boolean) => ({
      type: 'Control' as const,
      scope: '#/properties/value',
      options: { format: 'radio', ...(vertical === undefined ? {} : { vertical }) },
    });
    const { view } = await mountForm({
      schema,
      uischema: uischema(),
      data: { value: 'A' },
      config: { vertical: true, jsonformsExtended: { radio: { vertical: true } } },
      renderers: [entry],
    });
    const orientation = () =>
      view.container
        .querySelector('[data-radio-orientation]')
        ?.getAttribute('data-radio-orientation');
    expect(orientation()).toBe('vertical');
    await view.rerender({ uischema: uischema(false) });
    expect(orientation()).toBe('horizontal');
    await view.rerender({ uischema: uischema(), config: { vertical: true } });
    expect(orientation()).toBe('horizontal');
  });

  it('associates visible help with each focused radio option', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B'], description: 'Radio group help' },
      options: {
        format: 'radio',
        skeleton: { 'SegmentedControl.ItemHiddenInput': { 'aria-describedby': 'author-help' } },
      },
    });
    const radios = [...view.container.querySelectorAll<HTMLElement>('input[type="radio"]')];
    expect(radios).toHaveLength(2);
    radios[1].focus();
    await tick();
    const helper = view.container.querySelector<HTMLElement>('[id$="-help"]');
    expect(helper?.textContent).toContain('Radio group help');
    expect(radios[1].getAttribute('aria-describedby')?.split(' ')).toContain('author-help');
    expect(radios[1].getAttribute('aria-describedby')?.split(' ')).toContain(helper?.id);
  });

  it('renders radio group when no data is provided', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'], title: 'Radio Choice' },
      options: { format: 'radio' },
    });

    const radios = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    );
    expect(radios).toHaveLength(3);
    await expect.element(page.getByRole('radiogroup', { name: 'Radio Choice' })).toBeVisible();
    expect(radios.every((radio) => !radio.checked)).toBe(true);
    expect((view.container.textContent ?? '').includes('Radio Choice')).toBe(true);
  });

  it('updates core data on radio selection', async () => {
    const { view, onchange } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      value: 'A',
      options: { format: 'radio' },
    });

    const radios = Array.from(
      view.container.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
    );
    expect(radios[0].checked).toBe(true);

    const before = onchange.mock.calls.length;
    radios[1].click();
    const changeEvent = await waitForChange(onchange, before);

    expect(changeEvent.data.value).toBe('B');
  });

  it('renders validation error when required data is missing', async () => {
    const { view } = await mountControl({
      renderers,
      propertySchema: { type: 'string', enum: ['A', 'B', 'C'] },
      options: { format: 'radio' },
      required: true,
    });

    expectValidationError(view.container);
  });
});
