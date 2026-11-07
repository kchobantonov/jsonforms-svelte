import { clearAllIds } from '@jsonforms/core';
import { afterEach, beforeEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { flowbiteRenderers } from '../../src/lib';
import { mountControl } from '../testUtils';

beforeEach(() => clearAllIds());
afterEach(async () => cleanup());

const mount = (focus: boolean, config: Record<string, unknown>) =>
  mountControl({
    renderers: flowbiteRenderers,
    propertySchema: {
      type: 'integer',
      minimum: 1,
      maximum: 6,
      default: 2,
      multipleOf: 2,
      title: 'Amount',
    },
    options: { slider: true, focus },
    config,
    value: 5,
  });

it('focuses the slider only on mount and respects local and disabled state', async () => {
  const optedOut = await mount(false, { focus: true });
  await expect
    .poll(() => optedOut.view.container.querySelector('input[type="range"], [role="slider"]'))
    .toBeTruthy();
  const thumb = optedOut.view.container.querySelector<HTMLElement>(
    'input[type="range"], [role="slider"]',
  );
  expect(thumb).toBeTruthy();
  expect(document.activeElement).not.toBe(thumb);
  await optedOut.view.rerender({
    uischema: {
      type: 'Control',
      scope: '#/properties/value',
      options: { slider: true, focus: true },
    },
  });
  expect(document.activeElement).not.toBe(thumb);
  await optedOut.view.unmount();

  const focused = await mount(true, { focus: false });
  const focusedThumb = focused.view.container.querySelector<HTMLElement>(
    'input[type="range"], [role="slider"]',
  );
  await expect.poll(() => document.activeElement).toBe(focusedThumb);
  const outside = document.createElement('button');
  document.body.append(outside);
  outside.focus();
  await focused.view.rerender({ data: { value: 6 } });
  expect(document.activeElement).toBe(outside);
  outside.remove();
  await focused.view.unmount();

  const disabled = await mount(true, { readonly: true });
  expect(document.activeElement).not.toBe(
    disabled.view.container.querySelector('input[type="range"], [role="slider"]'),
  );
});
