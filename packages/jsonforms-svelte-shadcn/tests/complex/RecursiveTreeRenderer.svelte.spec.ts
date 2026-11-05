import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema, ControlElement } from '@jsonforms/core';
import { shadcnRenderers } from '../../src/lib/renderers';
import schema from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/schema.json';
import initial from '@chobantonov/jsonforms-extended-spec/examples/recursive-tree/data.json';
import { uischemas } from '../../../jsonforms-svelte-demo-common/tests/fixtures/specAdapters/recursive-tree/uischemas';
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

it.each(['GENERATE', 'REGISTERED'])('resolves recursive node detail mode %s', async (detail) => {
  const { view } = await mount(undefined, {
    uischema: {
      ...ui,
      options: {
        ...ui.options,
        recursiveTree: { childrenProperty: 'children', labelProperty: 'name', detail },
      },
    },
    uischemas: [
      { tester: () => 20, uischema: { type: 'Label', text: 'Registered node detail' } },
      ...uischemas,
    ],
  });
  const pane = view.container.querySelector('[data-recursive-tree-detail]')!;
  await vi.waitFor(() => {
    if (detail === 'REGISTERED') expect(pane.textContent).toContain('Registered node detail');
    else expect(nameInput(view.container)?.value).toBe('Documents');
  });
  expect(pane.textContent?.includes('Registered node detail')).toBe(detail === 'REGISTERED');
  expect(pane.textContent).not.toContain('No applicable renderer');
});

it('does not offer rename for a prototype-named label absent from schema properties', async () => {
  const { view } = await mount(
    { populated: { constructor: 'Root', children: [] } },
    {
      schema: {
        type: 'object',
        properties: {
          populated: {
            type: 'object',
            properties: { children: { type: 'array', items: { type: 'object' } } },
          },
        },
      } satisfies JsonSchema,
      uischema: {
        ...ui,
        options: {
          ...ui.options,
          recursiveTree: { childrenProperty: 'children', labelProperty: 'constructor' },
        },
      },
      uischemas: [],
    },
  );
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-recursive-tree-navigation]')?.textContent).toContain(
      'Root',
    ),
  );
  expect(
    view.container.querySelector('[data-recursive-tree-navigation] [aria-label^="Rename"]'),
  ).toBeNull();
});

it.each(['children.log', '', 'constructor'])(
  'edits nested selected children beneath literal member %j',
  async (childrenProperty) => {
    const data = {
      root: {
        name: 'Root',
        [childrenProperty]: [
          { name: 'Child', [childrenProperty]: [{ name: 'Grandchild', [childrenProperty]: [] }] },
        ],
      },
    };
    const { view, onchange } = await mount(data, {
      schema: {
        type: 'object',
        properties: { root: { $ref: '#/definitions/node' } },
        definitions: {
          node: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              [childrenProperty]: { type: 'array', items: { $ref: '#/definitions/node' } },
            },
          },
        },
      } satisfies JsonSchema,
      uischema: {
        ...ui,
        scope: '#/properties/root',
        options: {
          ...ui.options,
          recursiveTree: {
            childrenProperty,
            labelProperty: 'name',
            detail: {
              type: 'VerticalLayout',
              elements: [{ type: 'Control', scope: '#/properties/name' }],
            },
          },
        },
      },
      uischemas: [],
    });
    await page.getByRole('button', { name: 'Child', exact: true }).first().click();
    await vi.waitFor(() => expect(nameInput(view.container)?.value).toBe('Child'));
    const input = nameInput(view.container)!;
    input.value = 'Edited';
    input.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await expect
      .poll(() => onchange.mock.lastCall?.[0].data.root[childrenProperty][0].name)
      .toBe('Edited');
    const changed = onchange.mock.lastCall?.[0].data;
    expect(changed.root.name).toBe('Root');
    await view.rerender({ data: changed });
    await page.getByRole('button', { name: 'Expand Edited', exact: true }).click();
    await page.getByRole('button', { name: 'Grandchild', exact: true }).first().click();
    await vi.waitFor(() => expect(nameInput(view.container)?.value).toBe('Grandchild'));
    const grandchildInput = nameInput(view.container)!;
    grandchildInput.value = 'Leaf';
    grandchildInput.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await expect
      .poll(
        () => onchange.mock.lastCall?.[0].data.root[childrenProperty][0][childrenProperty][0].name,
      )
      .toBe('Leaf');
    expect(onchange.mock.lastCall?.[0].data.root[childrenProperty][0].name).toBe('Edited');
    if (childrenProperty === 'children.log') {
      await view.rerender({
        data: onchange.mock.lastCall?.[0].data,
        additionalErrors: [
          {
            instancePath: '/root/children.log/0/children.log/0/name',
            keyword: 'server',
            schemaPath: '',
            params: {},
            message: 'Literal grandchild error',
          },
        ],
      });
      await expect.poll(() => nameInput(view.container)?.getAttribute('aria-invalid')).toBe('true');
      await view.rerender({
        additionalErrors: [
          {
            instancePath: '/root/children/log/0/children/log/0/name',
            keyword: 'server',
            schemaPath: '',
            params: {},
            message: 'Nested lookalike error',
          },
        ],
      });
      await expect
        .poll(() => nameInput(view.container)?.getAttribute('aria-invalid'))
        .not.toBe('true');
    }
  },
);

it('navigates a literal dotted child through the selected node detail', async () => {
  const { view } = await mount(
    {
      root: {
        name: 'Root',
        'children.log': [
          { name: 'Child', 'children.log': [{ name: 'Grandchild', 'children.log': [] }] },
        ],
      },
    },
    {
      schema: {
        type: 'object',
        properties: { root: { $ref: '#/definitions/node' } },
        definitions: {
          node: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              'children.log': { type: 'array', items: { $ref: '#/definitions/node' } },
            },
          },
        },
      } satisfies JsonSchema,
      uischema: {
        ...ui,
        scope: '#/properties/root',
        options: {
          ...ui.options,
          recursiveTree: { childrenProperty: 'children.log', labelProperty: 'name' },
        },
      },
      uischemas: [],
    },
  );
  await page.getByRole('button', { name: 'Child', exact: true }).first().click();
  const detail = view.container.querySelector<HTMLElement>('[data-recursive-tree-detail]')!;
  await vi.waitFor(() => expect(detail.textContent).toContain('Grandchild'));
  await page
    .elementLocator(detail)
    .getByRole('button', { name: 'Grandchild', exact: true })
    .click();
  await vi.waitFor(() => expect(nameInput(view.container)?.value).toBe('Grandchild'));
});

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
  const indicator = view.container.querySelector<HTMLElement>(
    '[data-recursive-tree-navigation] [data-container-validation-indicator]',
  )!;
  await page.elementLocator(indicator).click();
  await vi.waitFor(() => {
    const visible = Array.from(
      document.querySelectorAll<HTMLElement>('[data-error-summary]'),
    ).filter((element) => element.checkVisibility({ checkVisibilityCSS: true }));
    expect(visible).toHaveLength(1);
    expect(visible[0].querySelectorAll('li').length).toBeGreaterThanOrEqual(1);
  });
  await userEvent.keyboard('{Escape}');
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
