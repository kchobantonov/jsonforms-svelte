import { clearAllIds, type JsonFormsRendererRegistryEntry, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as enumEntry } from '../../src/lib/controls/EnumControlRenderer.entry';
import { entry as oneOfEnumEntry } from '../../src/lib/controls/OneOfEnumControlRenderer.entry';
import { entry as radioEntry } from '../../src/lib/controls/RadioGroupControlRenderer.entry';
import { entry as oneOfRadioEntry } from '../../src/lib/controls/OneOfRadioGroupControlRenderer.entry';
import { mountControl } from '../testUtils';

const cases: [string, JsonFormsRendererRegistryEntry, JsonSchema, Record<string, unknown>][] = [
  ['enum select', enumEntry, { type: 'string', enum: ['A', 'B'] }, {}],
  ['oneOf select', oneOfEnumEntry, { type: 'string', oneOf: [{ const: 'A' }, { const: 'B' }] }, {}],
  ['searchable enum', enumEntry, { type: 'string', enum: ['A', 'B'] }, { autocomplete: true }],
  [
    'searchable oneOf',
    oneOfEnumEntry,
    { type: 'string', oneOf: [{ const: 'A' }, { const: 'B' }] },
    { autocomplete: true },
  ],
  ['enum radio', radioEntry, { type: 'string', enum: ['A', 'B'] }, { format: 'radio' }],
  [
    'oneOf radio',
    oneOfRadioEntry,
    { type: 'string', oneOf: [{ const: 'A' }, { const: 'B' }] },
    { format: 'radio' },
  ],
];

beforeEach(() => clearAllIds());
afterEach(async () => cleanup());

it.each(cases)(
  '%s focuses only on mount with local precedence',
  async (_name, entry, propertySchema, options) => {
    const optedOut = await mountControl({
      renderers: [entry],
      propertySchema,
      options: { ...options, focus: false },
      config: { focus: true },
      value: 'A',
    });
    const target = () => optedOut.view.container.querySelector<HTMLElement>('button[id$="-input"]');
    expect(document.activeElement).not.toBe(target());
    await optedOut.view.rerender({
      uischema: {
        type: 'Control',
        scope: '#/properties/value',
        options: { ...options, focus: true },
      },
    });
    expect(document.activeElement).not.toBe(target());
    await optedOut.view.unmount();

    const focused = await mountControl({
      renderers: [entry],
      propertySchema,
      options,
      config: { focus: true },
      value: 'A',
    });
    const input = focused.view.container.querySelector<HTMLElement>('button[id$="-input"]');
    expect(input).toBeTruthy();
    await expect.poll(() => document.activeElement).toBe(input);
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    await focused.view.rerender({ data: { value: 'B' } });
    expect(document.activeElement).toBe(outside);
    outside.remove();
    await focused.view.unmount();

    const disabled = await mountControl({
      renderers: [entry],
      propertySchema,
      options,
      config: { focus: true, readonly: true },
      value: 'A',
    });
    const disabledInput =
      disabled.view.container.querySelector<HTMLElement>('button[id$="-input"]');
    expect(document.activeElement).not.toBe(disabledInput);
    await disabled.view.unmount();

    const locallyFocused = await mountControl({
      renderers: [entry],
      propertySchema,
      options: { ...options, focus: true },
      config: { focus: false },
      value: 'A',
    });
    const localInput =
      locallyFocused.view.container.querySelector<HTMLElement>('button[id$="-input"]');
    await expect.poll(() => document.activeElement).toBe(localInput);
    if (options.format === 'radio') {
      await locallyFocused.view.unmount();
      const selected = await mountControl({
        renderers: [entry],
        propertySchema,
        options,
        config: { focus: true },
        value: 'B',
      });
      const selectedInput = selected.view.container.querySelector(
        '[role="radio"][aria-checked="true"]',
      );
      await expect.poll(() => document.activeElement).toBe(selectedInput);
    }
  },
);
