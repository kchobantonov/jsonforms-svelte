import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { flowbiteRenderers, flowbiteCells } from '../../src/lib';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import type { JsonSchema } from '@jsonforms/core';

afterEach(cleanup);
async function setup(locale: 'en' | 'bg' = 'en') {
  const onchange = vi.fn();
  const props = {
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'array',
          items: [{ type: 'string', title: 'Code' }],
          additionalItems: { type: 'string', default: 'new' },
        },
      },
    } as JsonSchema,
    uischema: { type: 'Control', scope: '#/properties/value', options: { restrict: true } },
    data: { value: ['original', 'keep tail'], sibling: 'keep' },
    i18n: { locale },
    renderers: flowbiteRenderers,
    cells: flowbiteCells,
    onchange,
  };
  const view = await render(JsonForms, { props });
  const input = () => view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
  const add = () => {
    const button = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(
      (node) => node.getAttribute('aria-label') === messages[locale]['tuple.add'],
    );
    expect(button).toBeTruthy();
    button!.click();
  };
  return { props, view, input, add, onchange };
}
it.each(['en', 'bg'] as const)(
  'commits a tuple draft before one tail addition without blur in %s',
  async (locale) => {
    const { input, add, onchange } = await setup(locale);
    input().value = 'draft';
    input().dispatchEvent(new InputEvent('input', { bubbles: true }));
    add();
    add();
    await expect
      .poll(() => onchange.mock.lastCall?.[0].data)
      .toEqual({ value: ['draft', 'keep tail', 'new'], sibling: 'keep' });
  },
);
it('blocks tuple addition during composition and allows a fresh retry', async () => {
  const { props, input, add, onchange } = await setup();
  input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input().value = 'draft';
  input().dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  add();
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
  expect(input().value).toBe('draft');
  input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  add();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({ value: ['draft', 'keep tail', 'new'], sibling: 'keep' });
});
it.each(['readonly', 'schema', 'option'])('rechecks %s before tuple addition', async (reason) => {
  const { props, view, add, onchange } = await setup();
  add();
  await view.rerender({
    ...props,
    readonly: reason === 'readonly',
    schema: reason === 'schema' ? { ...props.schema, title: 'Replacement' } : props.schema,
    uischema:
      reason === 'option'
        ? { ...props.uischema, options: { ...props.uischema.options, disableAdd: true } }
        : props.uischema,
  });
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
});
it('cancels tuple addition after unmount', async () => {
  const { view, add, onchange } = await setup();
  const before = onchange.mock.calls.length;
  add();
  await view.unmount();
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.calls.length).toBe(before);
});
it.each([true, false])('honors tuple maxItems with restrict=%s', async (restrict) => {
  const { props, view, add, onchange } = await setup();
  await view.rerender({
    ...props,
    schema: {
      ...props.schema,
      properties: { value: { ...props.schema.properties!.value, maxItems: 2 } },
    } as JsonSchema,
    uischema: { ...props.uischema, options: { restrict } },
  });
  add();
  await new Promise(requestAnimationFrame);
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual(restrict ? props.data : { value: ['original', 'keep tail', 'new'], sibling: 'keep' });
});
