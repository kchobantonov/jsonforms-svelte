import '../test.css';
import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers } from '../../src/lib/renderers';
import type { ControlElement, JsonSchema, JsonSchema7, UISchemaElement } from '@jsonforms/core';
afterEach(cleanup);

it('selects typed values and explicit null, retaining reloaded structural identity', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: { enum: [{ id: 1 }, false, null] },
      data: { id: 1 },
      renderers: flowbiteRenderers,
      onchange,
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          format: 'cards',
          choices: [
            { value: { id: 1 }, label: 'Object' },
            { value: false, label: 'False' },
            { value: null, label: 'Null' },
          ],
        },
      },
    },
  });
  await expect.element(page.getByRole('radio', { name: 'Object', exact: true })).toBeChecked();
  await page.getByText('Null', { exact: true }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe(null));
});

it('resolves branch GENERATE before dispatch and edits an incomplete selected branch', async () => {
  const schema: JsonSchema7 = {
    type: 'object',
    properties: {
      contact: {
        oneOf: [
          {
            title: 'Email',
            type: 'object',
            properties: { kind: { const: 'email' }, address: { type: 'string', minLength: 3 } },
            required: ['kind', 'address'],
          },
          {
            title: 'Postal',
            type: 'object',
            properties: { kind: { const: 'post' }, street: { type: 'string' } },
            required: ['kind'],
          },
        ],
      },
    },
  };
  const uischema: ControlElement = {
    type: 'Control',
    scope: '#/properties/contact',
    options: {
      format: 'cards',
      showRadio: true,
      confirmation: { branchChange: 'never' },
      choices: [{ branch: 0, detail: 'GENERATE' }],
    },
  };
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema,
      uischema,
      data: { contact: { kind: 'post', street: 'old' }, sibling: 'keep' },
      renderers: flowbiteRenderers,
      onchange,
      uischemas: [{ tester: () => 10, uischema: { type: 'VerticalLayout', elements: [] } }],
    },
  });
  await page.getByText('Email', { exact: true }).click();
  await expect.element(page.getByRole('radio', { name: 'Email', exact: true })).toBeChecked();
  const input = page.getByRole('textbox', { name: /Address/ });
  await input.fill('a');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.contact.address).toBe('a'));
  await expect.element(page.getByRole('radio', { name: 'Email', exact: true })).toBeChecked();
  expect(onchange.mock.lastCall?.[0].data.sibling).toBe('keep');
});

import fixtureSchema from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/schema.json';
import fixtureUi from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/uischema.json';
import fixtureData from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/data.json';
import fixtureTranslations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';
import { createTranslator } from '../../../jsonforms-svelte-demo-common/src/lib/i18n/i18n';

type ExampleNode = UISchemaElement & { label?: string; elements?: ExampleNode[] };
function findDetails(node: ExampleNode): ExampleNode | undefined {
  if (node.label === 'Card detail modes') return node;
  return node.elements?.map(findDetails).find(Boolean);
}

it.each(['en', 'bg'])('executes the spec Card detail modes example in %s', async (locale) => {
  const category = findDetails(fixtureUi as ExampleNode)!;
  const registeredLabel = locale === 'bg' ? 'Регистриран имейл адрес' : 'Registered email address';
  const props = {
    schema: fixtureSchema as unknown as JsonSchema7,
    uischema: { ...category, type: 'VerticalLayout' },
    renderers: flowbiteRenderers,
    data: { ...fixtureData, cardContact: { kind: 'email', address: 'hello@example.com' } },
    i18n: { locale, translate: createTranslator(locale, fixtureTranslations) },
    uischemas: [
      {
        tester: (schema: JsonSchema, scope: string) =>
          scope === '#/properties/cardContact' && schema.properties?.address?.format === 'email'
            ? 10
            : -1,
        uischema: {
          type: 'Control',
          scope: '#/properties/address',
          label: 'Registered email address',
          i18n: 'cards.registeredAddress',
        },
      },
    ],
  };
  const view = await render(JsonForms, { props });
  await expect
    .element(page.getByRole('textbox', { name: registeredLabel, exact: true }))
    .toHaveValue('hello@example.com');
  await page
    .getByRole('textbox', { name: registeredLabel, exact: true })
    .fill('changed@example.com');
  await expect
    .element(page.getByRole('textbox', { name: /Email address/ }))
    .toHaveValue('changed@example.com');
  await view.rerender({
    ...props,
    data: { ...fixtureData, cardContact: { kind: 'postal', street: 'Main', city: 'Sofia' } },
  });
  await vi.waitFor(() => {
    const streets = Array.from(document.querySelectorAll<HTMLInputElement>('input')).filter(
      (input) => input.value === 'Main',
    );
    expect(streets).toHaveLength(2);
    expect(document.body.textContent).not.toContain(registeredLabel);
  });
});

it('keeps native keyboard selection when radio circles are hidden and skips disabled cards', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: { enum: [1, 2, 3] },
      data: 1,
      renderers: flowbiteRenderers,
      onchange,
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          format: 'cards',
          choices: [
            { value: 1, label: 'One' },
            { value: 2, label: 'Disabled', disabled: true },
            { value: 3, label: 'Three' },
          ],
        },
      },
    },
  });
  (page.getByRole('radio', { name: 'One', exact: true }).element() as HTMLElement).focus();
  await userEvent.keyboard('{ArrowRight}');
  await expect.element(page.getByRole('radio', { name: 'Three', exact: true })).toBeChecked();
  expect(onchange.mock.lastCall?.[0].data).toBe(3);
});

it('confirms branch changes and preserves enclosing values without preserving branch-only fields', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: { shared: { type: 'string' } },
        oneOf: [
          {
            type: 'object',
            title: 'First',
            required: ['kind'],
            properties: { kind: { const: 'first', default: 'first' }, note: { type: 'string' } },
          },
          {
            type: 'object',
            title: 'Second',
            required: ['kind'],
            properties: {
              kind: { const: 'second', default: 'second' },
              note: { type: 'string', default: 'fresh' },
            },
          },
        ],
      },
      uischema: { type: 'Control', scope: '#', options: { format: 'cards' } },
      renderers: flowbiteRenderers,
      data: { kind: 'first', note: 'old', shared: 'keep' },
      onchange,
    },
  });
  await page.getByText('Second', { exact: true }).click();
  await page.getByRole('button', { name: 'No', exact: true }).click();
  await expect.element(page.getByRole('radio', { name: 'First', exact: true })).toBeChecked();
  await page.getByText('Second', { exact: true }).click();
  await page.getByRole('button', { name: 'Yes', exact: true }).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      kind: 'second',
      note: 'fresh',
      shared: 'keep',
    }),
  );
});

it('disables card mutations when the form becomes readonly', async () => {
  const props = {
    schema: { enum: ['A', 'B'] },
    data: 'A',
    renderers: flowbiteRenderers,
    uischema: { type: 'Control', scope: '#', options: { format: 'cards' } },
  };
  const view = await render(JsonForms, { props });
  await view.rerender({ ...props, readonly: true });
  await expect.element(page.getByRole('radio', { name: 'B', exact: true })).toBeDisabled();
  await expect.element(page.getByRole('radio', { name: 'A', exact: true })).toBeChecked();
});

it.each(['replacement', 'readonly'] as const)(
  'cancels a pending branch change on %s',
  async (reason) => {
    const onchange = vi.fn();
    const schema: JsonSchema = {
      type: 'object',
      oneOf: ['First', 'Second'].map((title) => ({
        type: 'object',
        title,
        required: ['kind'],
        properties: { kind: { const: title, default: title }, note: { type: 'string' } },
      })),
    };
    const props = {
      schema,
      data: { kind: 'First', note: 'original' },
      renderers: flowbiteRenderers,
      uischema: { type: 'Control', scope: '#', options: { format: 'cards' } },
      onchange,
    };
    const view = await render(JsonForms, { props });
    await page.getByText('Second', { exact: true }).click();
    await expect.element(page.getByRole('button', { name: 'Yes', exact: true })).toBeVisible();
    const data = reason === 'replacement' ? { kind: 'First', note: 'replacement' } : props.data;
    await view.rerender({ ...props, data, readonly: reason === 'readonly' });
    await expect
      .element(page.getByRole('button', { name: 'Yes', exact: true }))
      .not.toBeInTheDocument();
    await view.rerender({ ...props, data, readonly: false });
    await expect.element(page.getByRole('radio', { name: 'First', exact: true })).toBeChecked();
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    await page.getByText('Second', { exact: true }).click();
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.kind).toBe('Second'));
  },
);

it.each([false, true])(
  'coordinates branch changes with pending text (composing=%s)',
  async (composing) => {
    const onchange = vi.fn();
    const onvaliditychange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'object',
          properties: {
            contact: {
              oneOf: ['First', 'Second'].map((title) => ({
                type: 'object',
                title,
                required: ['kind'],
                properties: { kind: { const: title, default: title }, note: { type: 'string' } },
              })),
            },
          },
        },
        data: { contact: { kind: 'First' }, sibling: 'keep' },
        uischema: {
          type: 'Control',
          scope: '#/properties/contact',
          options: { format: 'cards', confirmation: { branchChange: 'complex' } },
        },
        renderers: flowbiteRenderers,
        onchange,
        onvaliditychange,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[type="text"]')!;
    if (composing) input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'new note';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: composing }));
    if (composing) await expect.poll(() => onvaliditychange.mock.lastCall?.[0].pending).toBe(true);
    // Activate without a blur: branch commands must resolve drafts themselves.
    (page.getByRole('radio', { name: 'Second', exact: true }).element() as HTMLElement).click();
    if (composing) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      await expect.element(page.getByRole('radio', { name: 'First', exact: true })).toBeChecked();
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        contact: { kind: 'First' },
        sibling: 'keep',
      });
      expect(page.getByRole('button', { name: 'Yes', exact: true }).query()).toBeNull();
      input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      (page.getByRole('radio', { name: 'Second', exact: true }).element() as HTMLElement).click();
    }
    await expect.element(page.getByRole('button', { name: 'Yes', exact: true })).toBeVisible();
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      contact: { kind: 'First', note: 'new note' },
      sibling: 'keep',
    });
    await page.getByRole('button', { name: 'No', exact: true }).click();
    await expect.element(page.getByRole('radio', { name: 'First', exact: true })).toBeChecked();
    expect(input.value).toBe('new note');
    await page.getByText('Second', { exact: true }).click();
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
    await expect
      .poll(() => onchange.mock.lastCall?.[0].data)
      .toEqual({
        contact: { kind: 'Second' },
        sibling: 'keep',
      });
  },
);
