import { expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import Reader from './fixtures/DynamicTreeReader.svelte';
import Selection from './fixtures/DynamicSelection.svelte';

it('parents filter and count the effective scope while dispatch updates the child', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object', properties: { b: { type: 'string', minLength: 2 } } },
      data: { b: '' },
      uischema: {
        type: 'Group',
        options: { showValidationIndicator: true, showValidationIndicatorCount: true },
        elements: [
          {
            type: 'Control',
            scope: '#/properties/a',
            $dynamic: { scope: { bind: 'external.scope' }, label: { bind: 'external.label' } },
          },
        ],
      } as any,
      config: { jsonformsExtended: { dynamic: { enabled: true } } },
      external: { scope: '#/properties/b', label: 'Effective' },
      renderers: [
        { tester: (ui: any) => (ui.type === 'Group' ? 2 : -1), renderer: Reader },
        { tester: () => 1, renderer: Selection },
      ],
    },
  });
  await expect
    .element(page.getByTestId('dynamic-renderer'))
    .toHaveAttribute('data-label', 'Effective');
  await expect.element(page.getByTestId('tree-indicator')).toHaveAttribute('data-count', '1');
  const instance = document.querySelector('[data-instance]')?.getAttribute('data-instance');
  await view.rerender({ external: { scope: '#/properties/b', label: 'Changed' } });
  await expect
    .element(page.getByTestId('dynamic-renderer'))
    .toHaveAttribute('data-label', 'Changed');
  expect(document.querySelector('[data-instance]')?.getAttribute('data-instance')).toBe(instance);
  await view.rerender({ external: { scope: '#/properties/a', label: 'Gone' } });
  await expect.element(page.getByTestId('dynamic-renderer')).not.toBeInTheDocument();
  await expect.element(page.getByTestId('tree-indicator')).toHaveAttribute('data-show', 'false');
});

import Parent from './fixtures/DynamicParent.svelte';
import Radio from './fixtures/DynamicRadio.svelte';
it('selects the parent from effective descendant types without requiring a helper in the renderer', async () => {
  const child = {
    type: 'Category',
    label: 'Static',
    $dynamic: { type: { bind: 'external.type' }, label: { bind: 'external.label' } },
  };
  const ui = { type: 'Categorization', elements: [child] };
  const config = { jsonformsExtended: { dynamic: { enabled: true } } };
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'object' },
      data: {},
      uischema: ui as any,
      config,
      external: { type: 'Category', label: 'Resolved' },
      renderers: [
        {
          tester: (element: any) =>
            element.type === 'Categorization' &&
            element.elements.every((item: any) => item.type === 'Category')
              ? 10
              : -1,
          renderer: Parent,
        },
        { tester: () => 1, renderer: Radio },
      ],
    },
  });
  await expect
    .element(page.getByTestId('parent-categories'))
    .toHaveAttribute('data-child-label', 'Resolved');
  const input = document.querySelector('input[aria-label="Parent draft"]') as HTMLInputElement;
  input.value = 'unfinished';
  input.focus();
  await view.rerender({ external: { type: 'Category', label: 'Updated' } });
  await expect
    .element(page.getByTestId('parent-categories'))
    .toHaveAttribute('data-child-label', 'Updated');
  expect(document.querySelector('input[aria-label="Parent draft"]')).toBe(input);
  expect(input.value).toBe('unfinished');
  await view.rerender({ external: { type: 'Control', label: 'Changed type' } });
  await expect.element(page.getByTestId('dynamic-renderer')).toHaveAttribute('data-mode', 'radio');
  expect(input.isConnected).toBe(false);
  await expect
    .poll(() => document.activeElement)
    .toBe(document.querySelector('[data-mode=radio] button'));
  await view.rerender({ external: { type: 'Category', label: 'Restored' } });
  await expect
    .element(page.getByTestId('parent-categories'))
    .toHaveAttribute('data-child-label', 'Restored');
  expect(
    (document.querySelector('input[aria-label="Parent draft"]') as HTMLInputElement).value,
  ).toBe('');
  expect(ui.elements[0].type).toBe('Category');
});

import ParentItems from './fixtures/DynamicParentItems.svelte';
it('resolves reused structural details in their own row before parent selection', async () => {
  const view = await render(JsonForms, {
    props: {
      data: {
        items: [
          { id: 'a', kind: 'Category', name: 'Ada' },
          { id: 'b', kind: 'Control', name: 'Grace' },
        ],
      },
      schema: {
        type: 'object',
        properties: { items: { type: 'array', items: { type: 'object' } } },
      },
      uischema: { type: 'Root' },
      config: { jsonformsExtended: { dynamic: { enabled: true } } },
      renderers: [
        { tester: (ui: any) => (ui.type === 'Root' ? 20 : -1), renderer: ParentItems },
        {
          tester: (ui: any) =>
            ui.type === 'Categorization' &&
            ui.elements.every((child: any) => child.type === 'Category')
              ? 10
              : -1,
          renderer: Parent,
        },
        { tester: () => 1, renderer: Radio },
      ],
    },
  });
  await expect
    .poll(() =>
      document.querySelector('[data-item=a] [data-child-label]')?.getAttribute('data-child-label'),
    )
    .toBe('Ada');
  await expect
    .poll(() => document.querySelector('[data-item=b] [data-mode]')?.getAttribute('data-mode'))
    .toBe('radio');
  await view.rerender({
    data: {
      items: [
        { id: 'b', kind: 'Category', name: 'Grace' },
        { id: 'a', kind: 'Control', name: 'Ada' },
      ],
    },
  });
  await expect
    .poll(() =>
      document.querySelector('[data-item=b] [data-child-label]')?.getAttribute('data-child-label'),
    )
    .toBe('Grace');
  await expect
    .poll(() => document.querySelector('[data-item=a] [data-mode]')?.getAttribute('data-mode'))
    .toBe('radio');
});
