import '../test.css';
import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as arrayEntry } from '../../src/lib/complex/ArrayControlRenderer.entry';
import { entry as textCellEntry } from '../../src/lib/cells/TextCell.entry';
import { mountControl, waitForChange } from '../testUtils';

afterEach(cleanup);

const propertySchema = {
  type: 'array',
  items: { type: 'string' },
};

it.each([
  { name: 'defaults', config: {}, options: {}, disabled: false },
  {
    name: 'flat true',
    config: { disableAdd: true, disableRemove: true },
    options: {},
    disabled: true,
  },
  {
    name: 'local false',
    config: { disableAdd: true, disableRemove: true },
    options: { disableAdd: false, disableRemove: false },
    disabled: false,
  },
  {
    name: 'local true',
    config: { disableAdd: false, disableRemove: false },
    options: { disableAdd: true, disableRemove: true },
    disabled: true,
  },
])('applies $name shared array action permissions', async ({ config, options, disabled }) => {
  const { view } = await mountControl({
    propertySchema,
    renderers: [arrayEntry],
    cells: [textCellEntry],
    value: ['first'],
    config,
    options,
  });
  const add = view.container.querySelector<HTMLButtonElement>('button[aria-label^="Add to"]');
  const remove = view.container.querySelector<HTMLButtonElement>('button[aria-label^="Delete"]');
  expect(add).not.toBeNull();
  expect(remove).not.toBeNull();
  if (!disabled) {
    view.container.querySelector<HTMLElement>('[aria-label^="Select row"]')!.click();
    await new Promise(requestAnimationFrame);
  }
  expect(add?.disabled).toBe(disabled);
  expect(remove?.disabled).toBe(disabled);
  expect(view.container.querySelector<HTMLInputElement>('input')?.disabled).toBe(false);
});

it('keeps schema bounds active when both local permission flags are false', async () => {
  const { view } = await mountControl({
    propertySchema: { ...propertySchema, minItems: 1, maxItems: 1 },
    renderers: [arrayEntry],
    cells: [textCellEntry],
    value: ['first'],
    config: { disableAdd: true, disableRemove: true },
    options: { disableAdd: false, disableRemove: false },
  });
  expect(
    view.container.querySelector<HTMLButtonElement>('button[aria-label^="Add to"]')?.disabled,
  ).toBe(true);
  expect(
    view.container.querySelector<HTMLButtonElement>('button[aria-label^="Delete"]')?.disabled,
  ).toBe(true);
});

it('keeps reorder available while Add and Delete are disabled', async () => {
  const { view, onchange } = await mountControl({
    propertySchema,
    renderers: [arrayEntry],
    cells: [textCellEntry],
    value: ['first', 'second'],
    config: { disableAdd: true, disableRemove: true },
    options: { showSortButtons: true },
  });
  const down = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(
    (button) =>
      button.getAttribute('aria-label')?.toLowerCase().includes('down') && !button.disabled,
  );
  expect(down).toBeTruthy();
  const before = onchange.mock.calls.length;
  down!.click();
  expect((await waitForChange(onchange, before)).data.value).toEqual(['second', 'first']);
});

it.each([true, false])('applies restrict=%s to Delete at minItems', async (restrict) => {
  const { view, onchange } = await mountControl({
    propertySchema: { ...propertySchema, minItems: 1 },
    renderers: [arrayEntry],
    cells: [textCellEntry],
    value: ['first'],
    options: { restrict, confirmation: { delete: 'never' } },
  });
  const remove = view.container.querySelector<HTMLButtonElement>('button[aria-label^="Delete"]');
  expect(remove).not.toBeNull();
  view.container.querySelector<HTMLElement>('[aria-label^="Select row"]')!.click();
  await new Promise(requestAnimationFrame);
  expect(remove!.disabled).toBe(restrict);
  const before = onchange.mock.calls.length;
  remove!.click();
  if (restrict) {
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(before);
  } else {
    expect((await waitForChange(onchange, before)).data.value).toEqual([]);
  }
});
