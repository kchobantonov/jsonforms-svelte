import type { UISchemaElement } from '@jsonforms/core';
import inferenceUiSchema from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-json-inference/uischema.json';
import '../../../jsonforms-svelte-flowbite/tests/test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
import { flowbiteRenderers, flowbiteCells } from '@chobantonov/jsonforms-svelte-flowbite';
import { flowbiteExtendedRenderers } from '../../src/lib/renderers';
import { flowbiteExtendedCells } from '../../src/lib/cells';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';

afterEach(cleanup);
it('edits inferred root strings and arrays after external type replacement', async () => {
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      data: 'hello',
      renderers: [...flowbiteRenderers, ...flowbiteExtendedRenderers],
      cells: [...flowbiteCells, ...flowbiteExtendedCells],
      onchange,
    },
  });
  const textbox = page.getByRole('textbox');
  await expect.element(textbox).toHaveValue('hello');
  const originalInput = textbox.element();
  await textbox.fill('changed');
  await expect.poll(() => onchange.mock.lastCall?.[0].data).toBe('changed');
  expect(textbox.element()).toBe(originalInput);
  await view.rerender({ data: ['first', 'second'] });
  await expect.poll(() => view.container.querySelectorAll('input[type="text"]').length).toBe(2);
  const inputs = view.container.querySelectorAll<HTMLInputElement>('input[type="text"]');
  expect(inputs[0].value).toBe('first');
  expect(inputs[1].value).toBe('second');
  await page.elementLocator(inputs[1]).fill('updated');
  await expect.poll(() => onchange.mock.lastCall?.[0].data).toEqual(['first', 'updated']);
  await view.rerender({ data: null });
  await expect.poll(() => view.container.querySelectorAll('input[type="text"]').length).toBe(0);
  expect(view.container.textContent).not.toContain('No applicable renderer found');
  await expect.element(page.getByRole('checkbox')).toBeChecked();
  expect(onchange.mock.lastCall?.[0].data).toBeNull();
});

it.each([undefined, {}])('offers a mixed editor for absent data with schema %j', async (schema) => {
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      schema,
      uischema: inferenceUiSchema as UISchemaElement,
      renderers: [...flowbiteRenderers, ...flowbiteExtendedRenderers],
      cells: [...flowbiteCells, ...flowbiteExtendedCells],
      onchange,
    },
  });
  await expect.poll(() => view.container.querySelector('[id$="-input-selector"]')).toBeTruthy();
  expect(view.container.textContent).not.toContain('No applicable renderer found');
  expect(onchange.mock.lastCall?.[0].data).toBeUndefined();
  await view.rerender({ data: 'hello' });
  await expect.element(page.getByRole('textbox')).toHaveValue('hello');
  await page.getByRole('textbox').fill('updated');
  await expect.poll(() => onchange.mock.lastCall?.[0].data).toBe('updated');
  await view.rerender({ data: undefined });
  await expect.poll(() => view.container.querySelector('[id$="-input-selector"]')).toBeTruthy();
  expect(onchange.mock.lastCall?.[0].data).toBeUndefined();
});

it('cancels a pending string edit when the host replaces the root', async () => {
  const onchange = vi.fn();
  const view = render(JsonForms, {
    props: {
      data: 'original',
      renderers: [...flowbiteRenderers, ...flowbiteExtendedRenderers],
      cells: [...flowbiteCells, ...flowbiteExtendedCells],
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
  input.value = 'pending';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await view.rerender({ data: ['replacement'] });
  await new Promise((resolve) => setTimeout(resolve, 400));
  expect(onchange.mock.lastCall?.[0].data).toEqual(['replacement']);
});
