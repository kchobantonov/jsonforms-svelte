import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema, ControlElement } from '@jsonforms/core';
import { shadcnRenderers } from '../../src/lib/renderers';
import schema from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/schema.json';
import initial from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/data.json';
import { uischemas } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-recursive-tree/uischemas';
afterEach(cleanup);
const ui: ControlElement = {
  type: 'Control',
  scope: '#/properties/populated',
  label: 'Kind',
  options: {
    confirmation: { delete: 'never' },
    recursiveTree: {
      childrenProperty: 'children',
      labelProperty: 'name',
      detail: { type: 'Control', scope: '#', label: 'Kind' },
    },
  },
};
const mount = async (data: unknown = structuredClone(initial), options = {}) => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: schema as JsonSchema,
      data,
      uischema: ui,
      uischemas,
      renderers: shadcnRenderers,
      onchange,
      ...options,
    },
  });
  return { view, onchange };
};
const nameInput = (container: HTMLElement) =>
  container.querySelector<HTMLInputElement>('[data-recursive-tree-detail] input[id*="name"]');

it('edits the selected node without rendering descendant fields or changing siblings', async () => {
  const { view, onchange } = await mount();
  await vi.waitFor(() => expect(nameInput(view.container)?.value).toBe('Documents'));
  expect(
    view.container.querySelectorAll('[data-recursive-tree-detail] input[id*="name"]'),
  ).toHaveLength(1);
  await page.getByRole('button', { name: 'readme.txt', exact: true }).first().click();
  await vi.waitFor(() => expect(nameInput(view.container)?.value).toBe('readme.txt'));
  const input = nameInput(view.container)!;
  input.value = 'updated.txt';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data.populated.children[0].name).toBe('updated.txt'),
  );
  expect(onchange.mock.lastCall?.[0].data.populated.children[1]).toEqual(
    initial.populated.children[1],
  );
  expect(view.container.textContent).not.toContain('No applicable renderer');
});

it('renames a child and selects its parent after deleting the selected node', async () => {
  const { view, onchange } = await mount();
  await page.getByRole('button', { name: 'Rename readme.txt', exact: true }).click();
  const name = page.getByRole('textbox', { name: 'Rename', exact: true });
  await name.fill('renamed.txt');
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data.populated.children[0].name)
    .toBe('renamed.txt');
  await page.getByRole('button', { name: 'renamed.txt', exact: true }).first().click();
  await page.getByRole('button', { name: 'Delete renamed.txt', exact: true }).click();
  await expect.poll(() => onchange.mock.lastCall?.[0].data.populated.children).toHaveLength(1);
  await vi.waitFor(() => expect(nameInput(view.container)?.value).toBe('Documents'));
  expect(onchange.mock.lastCall?.[0].data.populated.children[0]).toEqual(
    initial.populated.children[1],
  );
});

it('keeps readonly navigation and indexes descendant errors under the indicator settings', async () => {
  const { view } = await mount(
    { populated: { kind: 'folder', name: 'Root', children: [{}] } },
    {
      readonly: true,
      config: { jsonformsExtended: { showValidationIndicator: true } },
    },
  );
  await vi.waitFor(() =>
    expect(
      view.container.querySelectorAll('[data-container-validation-indicator]').length,
    ).toBeGreaterThanOrEqual(2),
  );
  expect(
    view.container.querySelector('[data-recursive-tree-navigation] button[aria-label^="Rename"]'),
  ).toBeNull();
  expect(
    view.container.querySelector('[data-recursive-tree-navigation] button[aria-label^="Delete"]'),
  ).toBeNull();
  await page.getByRole('button', { name: '1', exact: true }).first().click();
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-recursive-tree-detail]')?.textContent).toContain(
      'Choose a kind',
    ),
  );
  await view.rerender({ config: { jsonformsExtended: { showValidationIndicator: false } } });
  await vi.waitFor(() =>
    expect(view.container.querySelectorAll('[data-container-validation-indicator]')).toHaveLength(
      0,
    ),
  );
});

it('adds an empty child through the native collection and opens its editor', async () => {
  const { view, onchange } = await mount({
    populated: { kind: 'folder', name: 'Root', children: [] },
  });
  const add = page.getByRole('button', { name: /Add/ }).first();
  await add.click();
  await expect.poll(() => onchange.mock.lastCall?.[0].data.populated.children).toEqual([{}]);
  await page.getByRole('button', { name: '1', exact: true }).first().click();
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-recursive-tree-detail]')?.textContent).toContain(
      'Choose a kind',
    ),
  );
});

it('does not delete a replacement item after confirmation opens', async () => {
  const { view, onchange } = await mount(structuredClone(initial), {
    uischema: { ...ui, options: { ...ui.options, confirmation: { delete: 'always' } } },
  });
  await page.getByRole('button', { name: 'Delete readme.txt', exact: true }).click();
  await expect.element(page.getByRole('dialog')).toBeVisible();
  const replacement = structuredClone(initial);
  replacement.populated.children[0].name = 'replacement.txt';
  await view.rerender({ data: replacement });
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  expect(onchange.mock.lastCall?.[0].data.populated.children).toEqual(
    replacement.populated.children,
  );
});

it('keeps native collection bounds on imported recursive children', async () => {
  const bounded: JsonSchema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      children: { type: 'array', minItems: 1, maxItems: 1, items: { $ref: '#' } },
    },
  };
  const { view } = await mount(
    { name: 'Root', children: [{ name: 'Child' }] },
    {
      schema: bounded,
      uischema: { ...ui, scope: '#' },
    },
  );
  await vi.waitFor(() =>
    expect(view.container.querySelectorAll('[data-recursive-node]')).toHaveLength(2),
  );
  expect(
    view.container.querySelector(
      '[data-recursive-tree-navigation] button[aria-label="Delete Child"]',
    ),
  ).toBeNull();
  await expect.element(page.getByRole('button', { name: /Add/ }).first()).toBeDisabled();
  await view.rerender({ config: { restrict: false } });
  await expect.element(page.getByRole('button', { name: /Add/ }).first()).toBeEnabled();
  await view.rerender({ config: { restrict: true } });
  await expect.element(page.getByRole('button', { name: /Add/ }).first()).toBeDisabled();
});
