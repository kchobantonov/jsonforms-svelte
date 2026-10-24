import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { tick } from 'svelte';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { skeletonRenderers, skeletonCells } from '../../src/lib';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import type { JsonSchema } from '@jsonforms/core';

afterEach(cleanup);
async function setup(kind: string, policy = 'complex', locale: 'en' | 'bg' = 'en') {
  const onchange = vi.fn();
  const props = {
    schema: {
      type: 'object',
      properties: {
        rows: {
          type: 'array',
          items: {
            type: 'object',
            properties: { note: { type: 'string' } },
          },
        },
      },
    } as JsonSchema,
    uischema: {
      type: kind === 'list' ? 'ListWithDetail' : 'Control',
      scope: '#/properties/rows',
      options: {
        ...(kind === 'layout' ? { detail: 'GENERATED' } : {}),
        confirmation: { delete: policy },
        showSortButtons: true,
      },
    },
    data: { rows: [{}, { note: 'keep row' }], sibling: 'keep' },
    i18n: { locale },
    renderers: skeletonRenderers,
    cells: skeletonCells,
    onchange,
  };
  const view = await render(JsonForms, { props });
  if (kind === 'list') {
    view.container.querySelector<HTMLElement>('[role="option"], button[aria-current]')!.click();
    await tick();
  }
  const remove = () => {
    const button = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(
      (node) => node.getAttribute('aria-label') === messages[locale]['array.removeAriaLabel'],
    );
    expect(button).toBeTruthy();
    button!.click();
  };
  const input = () => view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
  return { view, props, onchange, remove, input };
}
for (const kind of ['table', 'layout', 'list']) {
  it.each(['en', 'bg'] as const)(
    `flushes ${kind} drafts before deletion and preserves cancellation in %s`,
    async (locale) => {
      const { input, remove, onchange } = await setup(kind, 'complex', locale);
      expect(input()).toBeTruthy();
      input().value = 'draft';
      input().dispatchEvent(new InputEvent('input', { bubbles: true }));
      remove();
      remove();
      const decline = page.getByRole('button', {
        name: messages[locale]['confirm.decline'],
        exact: true,
      });
      await expect.element(decline).toBeVisible();
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        rows: [{ note: 'draft' }, { note: 'keep row' }],
        sibling: 'keep',
      });
      await decline.click();
      await expect.element(decline).not.toBeInTheDocument();
      remove();
      await new Promise(requestAnimationFrame);
      await page
        .getByRole('button', { name: messages[locale]['confirm.accept'], exact: true })
        .click();
      await expect
        .poll(() => onchange.mock.lastCall?.[0].data)
        .toEqual({ rows: [{ note: 'keep row' }], sibling: 'keep' });
    },
  );
  it(`blocks ${kind} deletion during composition even with never policy and retries`, async () => {
    const { input, remove, onchange } = await setup(kind, 'never');
    input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input().value = 'draft';
    input().dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    remove();
    await new Promise(requestAnimationFrame);
    expect(input().value).toBe('draft');
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      rows: [{}, { note: 'keep row' }],
      sibling: 'keep',
    });
    expect(page.getByRole('dialog').query()).toBeNull();
    input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    remove();
    await expect
      .poll(() => onchange.mock.lastCall?.[0].data)
      .toEqual({ rows: [{ note: 'keep row' }], sibling: 'keep' });
  });
}
it.each(['data', 'schema', 'readonly', 'disabledRemove'])(
  'invalidates deletion when %s changes',
  async (reason) => {
    const { view, props, remove, onchange } = await setup('table', 'always');
    remove();
    const accept = page.getByRole('button', { name: 'Yes', exact: true });
    await expect.element(accept).toBeVisible();
    const data =
      reason === 'data' ? { rows: [{ note: 'replacement' }], sibling: 'keep' } : props.data;
    await view.rerender({
      ...props,
      data,
      readonly: reason === 'readonly',
      schema: reason === 'schema' ? { ...props.schema, title: 'Replacement' } : props.schema,
      uischema:
        reason === 'disabledRemove'
          ? { ...props.uischema, options: { ...props.uischema.options, disableRemove: true } }
          : props.uischema,
    });
    await expect.element(accept).not.toBeInTheDocument();
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  },
);

function command(container: HTMLElement, action: 'add' | 'down' | 'up', index = 0) {
  const label =
    action === 'add'
      ? messages.en['array.addAriaLabelWithLabel'].replace('{label}', 'Rows')
      : messages.en[`array.${action}AriaLabel`];
  const buttons = [...container.querySelectorAll<HTMLButtonElement>('button')].filter(
    (node) => node.getAttribute('aria-label') === label,
  );
  expect(buttons[index]).toBeTruthy();
  buttons[index].click();
}
for (const kind of ['table', 'layout', 'list']) {
  for (const action of ['add', 'down'] as const) {
    it(`resolves ${kind} drafts before ${action} and ignores duplicate activation`, async () => {
      const { view, input, onchange } = await setup(kind);
      input().value = 'draft';
      input().dispatchEvent(new InputEvent('input', { bubbles: true }));
      command(view.container, action);
      command(view.container, action);
      await expect
        .poll(() => onchange.mock.lastCall?.[0].data)
        .toEqual({
          rows:
            action === 'add'
              ? [{ note: 'draft' }, { note: 'keep row' }, {}]
              : [{ note: 'keep row' }, { note: 'draft' }],
          sibling: 'keep',
        });
      if (action === 'down' && kind !== 'table') {
        await expect.element(page.getByRole('textbox')).toHaveValue('draft');
        const selected = page.getByRole('textbox').element() as HTMLInputElement;
        selected.value = 'moved draft';
        selected.dispatchEvent(new InputEvent('input', { bubbles: true }));
        command(view.container, 'up', 1);
        await expect
          .poll(() => onchange.mock.lastCall?.[0].data)
          .toEqual({ rows: [{ note: 'moved draft' }, { note: 'keep row' }], sibling: 'keep' });
      }
      if (action === 'add' && kind === 'layout') {
        await expect.element(page.getByRole('textbox')).toHaveValue('');
      }
    });
    it(`blocks ${kind} ${action} during composition and permits a fresh retry`, async () => {
      const { view, input, onchange } = await setup(kind);
      input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      input().value = 'draft';
      input().dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      command(view.container, action);
      await new Promise(requestAnimationFrame);
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        rows: [{}, { note: 'keep row' }],
        sibling: 'keep',
      });
      expect(input().value).toBe('draft');
      input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      command(view.container, action);
      await expect
        .poll(() => onchange.mock.lastCall?.[0].data)
        .toEqual({
          rows:
            action === 'add'
              ? [{ note: 'draft' }, { note: 'keep row' }, {}]
              : [{ note: 'keep row' }, { note: 'draft' }],
          sibling: 'keep',
        });
    });
  }
}
for (const action of ['add', 'down'] as const) {
  it.each(['readonly', 'schema', 'option'])(
    `rechecks %s changes before ${action}`,
    async (reason) => {
      const { view, props, onchange } = await setup('table');
      command(view.container, action);
      await view.rerender({
        ...props,
        readonly: reason === 'readonly',
        schema: reason === 'schema' ? { ...props.schema, title: 'Replacement' } : props.schema,
        uischema:
          reason === 'option'
            ? {
                ...props.uischema,
                options: { ...props.uischema.options, disableAdd: true, showSortButtons: false },
              }
            : props.uischema,
      });
      await new Promise(requestAnimationFrame);
      expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
    },
  );
}
it.each([true, false])('honors restrict=%s when adding at maxItems', async (restrict) => {
  const { view, props, onchange } = await setup('table');
  await view.rerender({
    ...props,
    schema: {
      ...props.schema,
      properties: { rows: { ...props.schema.properties!.rows, maxItems: 2 } },
    } as JsonSchema,
    uischema: { ...props.uischema, options: { ...props.uischema.options, restrict } },
  });
  command(view.container, 'add');
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(
    restrict ? props.data : { rows: [{}, { note: 'keep row' }, {}], sibling: 'keep' },
  );
});

it.each([true, false])(
  'honors collapseNewItems=%s when adding to a layout',
  async (collapseNewItems) => {
    const { view, props, onchange } = await setup('layout');
    await view.rerender({
      ...props,
      data: { rows: [{ note: 'first' }, { note: 'second' }], sibling: 'keep' },
      uischema: { ...props.uischema, options: { ...props.uischema.options, collapseNewItems } },
    });
    command(view.container, 'add');
    await expect.poll(() => onchange.mock.lastCall?.[0].data.rows.length).toBe(3);
    await expect.element(page.getByRole('textbox')).toHaveValue(collapseNewItems ? 'first' : '');
  },
);
it('keeps reorder bounds inert at the first and last row', async () => {
  const { view, props, onchange } = await setup('table');
  command(view.container, 'up', 0);
  command(view.container, 'down', 1);
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
});

it('cancels an add when its collection unmounts during preparation', async () => {
  const { view, props, onchange } = await setup('table');
  command(view.container, 'add');
  await view.unmount();
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
});
