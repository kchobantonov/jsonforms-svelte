import { clearAllIds, type JsonFormsRendererRegistryEntry, type JsonSchema } from '@jsonforms/core';
import { afterEach, beforeEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import {
  colorControlRendererEntry,
  cronControlRendererEntry,
  durationControlRendererEntry,
  fileControlRendererEntry,
  nullControlRendererEntry,
} from '../../src/lib/controls';
import { mountControl } from '../testUtils';

const cases: [string, JsonFormsRendererRegistryEntry, JsonSchema, unknown][] = [
  ['color', colorControlRendererEntry, { type: 'string', format: 'color' }, '#112233'],
  ['cron', cronControlRendererEntry, { type: 'string', format: 'cron' }, '0 0 * * *'],
  ['duration', durationControlRendererEntry, { type: 'string', format: 'duration' }, 'P1D'],
  ['file', fileControlRendererEntry, { type: 'string', format: 'byte' }, undefined],
  ['null', nullControlRendererEntry, { type: 'null' }, null],
];

beforeEach(() => clearAllIds());
afterEach(async () => cleanup());

it.each(cases)(
  '%s focuses its primary control only on mount',
  async (_name, entry, propertySchema, value) => {
    const target = (container: HTMLElement) =>
      container.querySelector<HTMLElement>('[id="#/properties/value-input"]');
    const optedOut = await mountControl({
      renderers: [entry],
      propertySchema,
      value,
      config: { focus: true },
      options: { focus: false },
    });
    expect(target(optedOut.view.container)).toBeTruthy();
    expect(document.activeElement).not.toBe(target(optedOut.view.container));
    await optedOut.view.rerender({
      uischema: { type: 'Control', scope: '#/properties/value', options: { focus: true } },
    });
    expect(document.activeElement).not.toBe(target(optedOut.view.container));
    await optedOut.view.unmount();

    const focused = await mountControl({
      renderers: [entry],
      propertySchema,
      value,
      config: { focus: true },
    });
    const input = target(focused.view.container);
    await expect.poll(() => document.activeElement).toBe(input);
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    await focused.view.rerender({ data: { value } });
    expect(document.activeElement).toBe(outside);
    outside.remove();
  },
);
