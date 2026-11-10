import { TRUST_DYNAMIC_FUNCTIONS } from '../src/lib/dynamicConfig';
import { expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import type { JsonFormsRendererRegistryEntry, UISchemaElement } from '@jsonforms/core';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import DispatchCell from '../src/lib/components/DispatchCell.svelte';
import DynamicSelection from './fixtures/DynamicSelection.svelte';
import DynamicRadio from './fixtures/DynamicRadio.svelte';
import DynamicItems from './fixtures/DynamicItems.svelte';
import DynamicMappedLayout from './fixtures/DynamicMappedLayout.svelte';
import DynamicDraft from './fixtures/DynamicDraft.svelte';
import DynamicCellHost from './fixtures/DynamicCellHost.svelte';

const authored = {
  type: 'Control',
  scope: '#',
  label: 'Plan',
  $dynamic: [
    {
      overlay: {
        label: { bind: 'external.settings.label' },
        options: { readonly: { bind: 'external.settings.readonly' } },
      },
    },
    {
      when: { expression: "external.settings.presentation == 'radio'" },
      overlay: { options: { format: 'radio' } },
    },
  ],
} as unknown as UISchemaElement;
const renderers: JsonFormsRendererRegistryEntry[] = [
  {
    tester: (ui) =>
      (ui as { options?: { format?: string } }).options?.format === 'radio' ? 10 : -1,
    renderer: DynamicRadio,
  },
  { tester: () => 1, renderer: DynamicSelection },
];

it('resolves settings before selection and preserves the instance for prop-only changes', async () => {
  const settings = { label: 'Subscription plan', readonly: false, presentation: 'automatic' };
  const props = {
    data: 'pro',
    schema: { type: 'string' },
    uischema: authored,
    renderers,
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { settings },
  };
  const view = await render(JsonForms, { props });
  const renderer = page.getByTestId('dynamic-renderer');
  await expect.element(renderer).toHaveAttribute('data-label', 'Subscription plan');
  const first = document
    .querySelector('[data-testid=dynamic-renderer]')
    ?.getAttribute('data-instance');
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { settings: { ...settings, label: 'Plan choice' } },
  });
  await expect.element(renderer).toHaveAttribute('data-label', 'Plan choice');
  expect(
    document.querySelector('[data-testid=dynamic-renderer]')?.getAttribute('data-instance'),
  ).toBe(first);
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { settings: { ...settings, presentation: 'radio' } },
  });
  await expect.element(renderer).toHaveAttribute('data-label', 'Subscription plan');
  await expect.element(renderer).toHaveAttribute('data-mode', 'radio');
  expect(
    document.querySelector('[data-testid=dynamic-renderer]')?.getAttribute('data-instance'),
  ).not.toBe(first);
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { settings },
  });
  await expect.element(renderer).toHaveAttribute('data-label', 'Subscription plan');
  await expect.element(renderer).toHaveAttribute('data-mode', 'automatic');
});

it('uses the effective element for compact cell selection', async () => {
  const settings = { label: 'Subscription plan', readonly: false, presentation: 'automatic' };
  const props = {
    data: 'pro',
    schema: { type: 'string' },
    uischema: authored,
    renderers: [{ tester: () => 1, renderer: DispatchCell }],
    cells: [
      {
        tester: (ui: UISchemaElement) =>
          (ui as { options?: { format?: string } }).options?.format === 'radio' ? 10 : -1,
        cell: DynamicRadio,
      },
      { tester: () => 1, cell: DynamicSelection },
    ],
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { settings },
  };
  const view = await render(JsonForms, { props });
  const renderer = page.getByTestId('dynamic-renderer');
  await expect.element(renderer).toHaveAttribute('data-mode', 'automatic');
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { settings: { ...settings, presentation: 'radio' } },
  });
  await expect.element(renderer).toHaveAttribute('data-mode', 'radio');
});

it('requires explicit opt-in for authored $dynamic', async () => {
  await render(JsonForms, {
    props: { data: 'pro', schema: { type: 'string' }, uischema: authored, renderers },
  });
  await expect.element(page.getByTestId('dynamic-renderer')).toHaveAttribute('data-label', 'Plan');
});

it('can change the element type used by renderer selection', async () => {
  const uischema = {
    type: 'Control',
    scope: '#',
    $dynamic: { type: { bind: 'external.elementType' } },
  } as unknown as UISchemaElement;
  const choices: JsonFormsRendererRegistryEntry[] = [
    { tester: (ui) => (ui.type === 'Label' ? 10 : -1), renderer: DynamicRadio },
    { tester: () => 1, renderer: DynamicSelection },
  ];
  const props = {
    data: 'kept',
    schema: { type: 'string' },
    uischema,
    renderers: choices,
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { elementType: 'Control' },
  };
  const view = await render(JsonForms, { props });
  const renderer = page.getByTestId('dynamic-renderer');
  await expect.element(renderer).toHaveAttribute('data-mode', 'automatic');
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { elementType: 'Label' },
  });
  await expect.element(renderer).toHaveAttribute('data-mode', 'radio');
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { elementType: 'Control' },
  });
  await expect.element(renderer).toHaveAttribute('data-mode', 'automatic');
});

it('resolves item and value per collection occurrence through reorder', async () => {
  const props = {
    data: {
      items: [
        { id: 'first', name: 'Alpha' },
        { id: 'second', name: 'Beta' },
      ],
    },
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: { id: { type: 'string' }, name: { type: 'string' } },
          },
        },
      },
    },
    uischema: { type: 'VerticalLayout', elements: [] } as UISchemaElement,
    renderers: [
      {
        tester: (ui: UISchemaElement) => (ui.type === 'VerticalLayout' ? 10 : -1),
        renderer: DynamicItems,
      },
      { tester: () => 1, renderer: DynamicSelection },
    ],
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
  };
  const view = await render(JsonForms, { props });
  const first = page.getByTestId('dynamic-renderer').nth(0);
  const second = page.getByTestId('dynamic-renderer').nth(1);
  await expect.element(first).toHaveAttribute('data-label', 'Alpha: Alpha');
  await expect.element(second).toHaveAttribute('data-label', 'Beta: Beta');
  const firstInstance = document
    .querySelector('[data-item="first"] [data-testid="dynamic-renderer"]')
    ?.getAttribute('data-instance');
  await view.rerender({
    data: {
      items: [
        { id: 'second', name: 'Beta updated' },
        { id: 'first', name: 'Alpha' },
      ],
    },
  });
  await expect.element(first).toHaveAttribute('data-label', 'Beta updated: Beta updated');
  await expect.element(second).toHaveAttribute('data-label', 'Alpha: Alpha');
  expect(
    document
      .querySelector('[data-item="first"] [data-testid="dynamic-renderer"]')
      ?.getAttribute('data-instance'),
  ).toBe(firstInstance);
});

it('updates a root layout option from a CEL integer without remounting', async () => {
  const uischema = {
    type: 'VerticalLayout',
    options: { gap: 24 },
    $dynamic: { options: { gap: { expression: 'external.settings.compact ? 8 : 24' } } },
  } as unknown as UISchemaElement;
  const props = {
    data: {},
    schema: { type: 'object' },
    uischema,
    renderers: [{ tester: () => 1, renderer: DynamicSelection }],
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { settings: { compact: false } },
  };
  const view = await render(JsonForms, { props });
  const renderer = page.getByTestId('dynamic-renderer');
  await expect.element(renderer).toHaveAttribute('data-gap', '24');
  const instance = document
    .querySelector('[data-testid="dynamic-renderer"]')
    ?.getAttribute('data-instance');
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { settings: { compact: true } },
  });
  await expect.element(renderer).toHaveAttribute('data-gap', '8');
  expect(
    document.querySelector('[data-testid="dynamic-renderer"]')?.getAttribute('data-instance'),
  ).toBe(instance);
});

it('forwards a changing root layout option through the core layout binding', async () => {
  const uischema = {
    type: 'VerticalLayout',
    options: { gap: 24 },
    elements: [],
    $dynamic: { options: { gap: { expression: 'external.settings.compact ? 8 : 24' } } },
  } as unknown as UISchemaElement;
  const view = await render(JsonForms, {
    props: {
      data: {},
      schema: { type: 'object' },
      uischema,
      renderers: [{ tester: () => 1, renderer: DynamicMappedLayout }],
      config: { jsonformsExtended: { dynamic: { enabled: true } } },
      external: { settings: { compact: false } },
    },
  });
  const layout = page.getByTestId('dynamic-mapped-layout');
  await expect.element(layout).toHaveAttribute('data-gap', '24');
  await expect.element(layout).toHaveAttribute('data-sized-gap', '24px');
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { settings: { compact: true } },
  });
  await expect.element(layout).toHaveAttribute('data-gap', '8');
  await expect.element(layout).toHaveAttribute('data-sized-gap', '8px');
});

it('uses a child dynamic rule when the parent filters layout visibility', async () => {
  const uischema = {
    type: 'VerticalLayout',
    elements: [
      {
        type: 'Control',
        scope: '#/properties/name',
        $dynamic: {
          rule: {
            effect: 'HIDE',
            condition: { scope: '#/properties/hidden', schema: { const: true } },
          },
        },
      },
    ],
  } as unknown as UISchemaElement;
  const view = await render(JsonForms, {
    props: {
      data: { name: 'Alpha', hidden: false },
      schema: {
        type: 'object',
        properties: { name: { type: 'string' }, hidden: { type: 'boolean' } },
      },
      uischema,
      renderers: [{ tester: () => 1, renderer: DynamicMappedLayout }],
      config: { jsonformsExtended: { dynamic: { enabled: true } } },
    },
  });
  const layout = page.getByTestId('dynamic-mapped-layout');
  await expect.element(layout).toHaveAttribute('data-child-count', '1');
  await view.rerender({ data: { name: 'Alpha', hidden: true } });
  await expect.element(layout).toHaveAttribute('data-child-count', '0');
  await view.rerender({ data: { name: 'Alpha', hidden: false } });
  await expect.element(layout).toHaveAttribute('data-child-count', '1');
});

it('replaces a selected editor immediately and discards its uncommitted local draft', async () => {
  const changes: unknown[] = [];
  const uischema = {
    type: 'Control',
    scope: '#',
    $dynamic: [
      {
        when: { expression: "external.presentation == 'radio'" },
        overlay: { options: { format: 'radio' } },
      },
      {
        when: { expression: "external.presentation == 'plain'" },
        overlay: { options: { format: 'plain' } },
      },
    ],
  } as unknown as UISchemaElement;
  const view = await render(JsonForms, {
    props: {
      data: 5,
      schema: { type: 'number' },
      uischema,
      renderers: [
        {
          tester: (ui: UISchemaElement) =>
            (ui as { options?: { format?: string } }).options?.format === 'radio' ? 10 : -1,
          renderer: DynamicRadio,
        },
        {
          tester: (ui: UISchemaElement) =>
            (ui as { options?: { format?: string } }).options?.format === 'plain' ? 10 : -1,
          renderer: DynamicSelection,
        },
        { tester: () => 1, renderer: DynamicDraft },
      ],
      config: { jsonformsExtended: { dynamic: { enabled: true } } },
      external: { presentation: 'automatic' },
      onchange: (event: { data: unknown }) => changes.push(event.data),
    },
  });
  const draft = page.getByTestId('dynamic-draft');
  await draft.fill('1e');
  await expect.element(draft).toHaveValue('1e');
  await expect.element(draft).toHaveFocus();
  const changesBeforeSwitch = changes.length;
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { presentation: 'radio' },
  });
  await expect.element(page.getByTestId('dynamic-renderer')).toHaveAttribute('data-mode', 'radio');
  await expect.element(draft).not.toBeInTheDocument();
  await expect.element(page.getByTestId('dynamic-radio-focus')).toHaveFocus();
  expect(changes.length).toBe(changesBeforeSwitch);
  expect(changes.at(-1)).toBe(5);
  const elsewhere = document.createElement('button');
  document.body.append(elsewhere);
  elsewhere.focus();
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { presentation: 'automatic' },
  });
  await expect.element(draft).toBeInTheDocument();
  expect(document.activeElement).toBe(elsewhere);
  elsewhere.remove();
  await draft.fill('unfinished');
  await expect.element(draft).toHaveFocus();
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { presentation: 'plain' },
  });
  await expect
    .element(page.getByTestId('dynamic-renderer'))
    .toHaveAttribute('data-mode', 'automatic');
  await expect.poll(() => document.activeElement !== document.body).toBe(true);
});

it('preserves the selected instance when dynamic activation changes', async () => {
  const view = await render(JsonForms, {
    props: { data: 'pro', schema: { type: 'string' }, uischema: authored, renderers },
  });
  const instance = document
    .querySelector('[data-testid=dynamic-renderer]')
    ?.getAttribute('data-instance');
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { settings: { label: 'Plan', readonly: false, presentation: 'automatic' } },
  });
  await expect
    .element(page.getByTestId('dynamic-renderer'))
    .toHaveAttribute('data-instance', instance!);
  await view.rerender({ config: { jsonformsExtended: { dynamic: { enabled: false } } } });
  await expect
    .element(page.getByTestId('dynamic-renderer'))
    .toHaveAttribute('data-instance', instance!);
});

it('reads value from the full cell path without appending scope again', async () => {
  await render(JsonForms, {
    props: {
      data: { rows: [{ name: 'Ada' }] },
      schema: {
        type: 'object',
        properties: {
          rows: {
            type: 'array',
            items: { type: 'object', properties: { name: { type: 'string' } } },
          },
        },
      },
      uischema: { type: 'VerticalLayout' },
      renderers: [{ tester: () => 1, renderer: DynamicCellHost }],
      cells: [{ tester: () => 1, cell: DynamicSelection }],
      config: { jsonformsExtended: { dynamic: { enabled: true } } },
    },
  });
  await expect.element(page.getByTestId('dynamic-renderer')).toHaveAttribute('data-label', 'Ada');
});

it('replaces a same-component editing session when its effective scope changes', async () => {
  const view = await render(JsonForms, {
    props: {
      data: { first: 'one', second: 'two' },
      schema: {
        type: 'object',
        properties: { first: { type: 'string' }, second: { type: 'string' } },
      },
      uischema: {
        type: 'Control',
        scope: '#/properties/first',
        $dynamic: { scope: { bind: 'external.scope' } },
      } as UISchemaElement,
      renderers: [{ tester: () => 1, renderer: DynamicSelection }],
      config: { jsonformsExtended: { dynamic: { enabled: true } } },
      external: { scope: '#/properties/first' },
    },
  });
  const instance = document
    .querySelector('[data-testid=dynamic-renderer]')
    ?.getAttribute('data-instance');
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { scope: '#/properties/second' },
  });
  await expect
    .element(page.getByTestId('dynamic-renderer'))
    .not.toHaveAttribute('data-instance', instance!);
});

it('does not reclaim focus after the user blurs the old editor', async () => {
  const view = await render(JsonForms, {
    props: {
      data: 5,
      schema: { type: 'number' },
      uischema: {
        type: 'Control',
        scope: '#',
        $dynamic: { options: { format: { bind: 'external.format' } } },
      } as UISchemaElement,
      renderers: [
        { tester: (ui) => (ui.options?.format === 'radio' ? 10 : -1), renderer: DynamicRadio },
        { tester: () => 1, renderer: DynamicDraft },
      ],
      config: { jsonformsExtended: { dynamic: { enabled: true } } },
      external: { format: 'text' },
    },
  });
  const input = document.querySelector<HTMLInputElement>('[data-testid=dynamic-draft]')!;
  input.focus();
  input.blur();
  await Promise.resolve();
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true } } },
    external: { format: 'radio' },
  });
  await expect.element(page.getByTestId('dynamic-radio-focus')).not.toHaveFocus();
  expect(document.activeElement).toBe(document.body);
});

it('requires config activation and the exact trusted capability at the form boundary', async () => {
  let calls = 0;
  const uischema = {
    type: 'Control',
    scope: '#',
    label: 'Static',
    $dynamic: {
      label: () => {
        calls++;
        return 'Trusted';
      },
    },
  };
  const view = await render(JsonForms, {
    props: {
      data: 'pro',
      schema: { type: 'string' },
      uischema,
      renderers,
      external: { label: 'External' },
    },
  });
  expect(calls).toBe(0);
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true, trusted: true } } },
  });
  expect(calls).toBe(0);
  await view.rerender({
    config: { jsonformsExtended: { dynamic: { enabled: true, trusted: TRUST_DYNAMIC_FUNCTIONS } } },
  });
  await expect
    .element(page.getByTestId('dynamic-renderer'))
    .toHaveAttribute('data-label', 'Trusted');
  const previous = calls;
  await view.rerender({
    config: {
      jsonformsExtended: { dynamic: { enabled: false, trusted: TRUST_DYNAMIC_FUNCTIONS } },
    },
  });
  await expect
    .element(page.getByTestId('dynamic-renderer'))
    .toHaveAttribute('data-label', 'Static');
  expect(calls).toBe(previous);
});
