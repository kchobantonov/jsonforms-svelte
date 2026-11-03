import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vite-plus/test/browser';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnRenderers } from '../../src/lib/renderers';
import type { ControlElement, JsonSchema, JsonSchema7, UISchemaElement } from '@jsonforms/core';
afterEach(cleanup);

it('associates focused card guidance with the radio group', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', title: 'Plan', description: 'Choose a plan', enum: ['A', 'B'] },
      data: 'A',
      renderers: shadcnRenderers,
      uischema: { type: 'Control', scope: '#', options: { format: 'cards' } },
    },
  });
  const group = view.container.querySelector<HTMLElement>('[role="radiogroup"]')!;
  const first = view.container.querySelector<HTMLElement>('[role="radio"], input[type="radio"]')!;
  first.focus();
  await vi.waitFor(() => {
    const help = view.container.querySelector<HTMLElement>('[id$="-help"]')!;
    expect(help.textContent).toContain('Choose a plan');
    expect(group.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
  });
  first.blur();
  await vi.waitFor(() => expect(group.hasAttribute('aria-describedby')).toBe(false));
});

it('updates only its own value when a choice card is nested in a Group', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          plan: { type: 'string', enum: ['A', 'B'] },
          note: { type: 'string' },
        },
      },
      data: { plan: 'A', note: 'Keep this note' },
      renderers: shadcnRenderers,
      onchange,
      uischema: {
        type: 'Group',
        label: 'Options',
        elements: [
          { type: 'Control', scope: '#/properties/plan', options: { format: 'cards' } },
          { type: 'Control', scope: '#/properties/note' },
        ],
      },
    },
  });
  await page.getByText('B', { exact: true }).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({ plan: 'B', note: 'Keep this note' }),
  );
});

it('keeps the choice label when authored card content contains a cycle', async () => {
  const cyclic: { type: string; elements: unknown[] } = {
    type: 'VerticalLayout',
    elements: [],
  };
  cyclic.elements.push(cyclic);
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', enum: ['A'] },
      data: 'A',
      renderers: shadcnRenderers,
      uischema: {
        type: 'Control',
        scope: '#',
        options: { format: 'cards', choices: [{ value: 'A', label: 'Choice A', content: cyclic }] },
      },
    },
  });
  expect(view.container.textContent).toContain('Choice A');
  expect(view.container.querySelector('.card-presentation')).toBeNull();
});

it('keeps keyboard focus distinct from selection and refuses a disabled card', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { enum: ['A', 'B', 'C'] },
      data: 'A',
      renderers: shadcnRenderers,
      onchange,
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          format: 'cards',
          choices: [{ value: 'A' }, { value: 'B' }, { value: 'C', disabled: true }],
        },
      },
    },
  });
  const radios = [...view.container.querySelectorAll<HTMLElement>('[role="radio"]')];
  expect(radios).toHaveLength(3);
  expect(radios[0].classList.contains('sr-only')).toBe(true);
  expect(
    radios[2].hasAttribute('data-disabled') || radios[2].getAttribute('aria-disabled') === 'true',
  ).toBe(true);
  await userEvent.keyboard('{Tab}');
  radios[0].focus();
  expect(document.activeElement).toBe(radios[0]);
  const focusedCard = radios[0].closest<HTMLElement>('label')!;
  expect(focusedCard.matches(':has(:focus-visible)')).toBe(true);
  expect(getComputedStyle(focusedCard).outlineStyle).not.toBe('none');
  await page.getByText('B', { exact: true }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('B'));
  const selectedCard = radios[1].closest<HTMLElement>('label')!;
  expect(getComputedStyle(selectedCard).borderTopColor).not.toBe(
    getComputedStyle(focusedCard).borderTopColor,
  );
  expect(selectedCard.matches(':has(:focus-visible)')).toBe(false);
  radios[2].click();
  expect(onchange.mock.lastCall?.[0].data).toBe('B');
});

it('renders a two-pixel selected border and switches cards to the error color', async () => {
  const props = {
    schema: { type: 'string', enum: ['A', 'B'] },
    data: 'A',
    renderers: shadcnRenderers,
    uischema: { type: 'Control', scope: '#', options: { format: 'cards' } },
  };
  const view = await render(JsonForms, { props });
  const radios = view.container.querySelectorAll<HTMLElement>(
    '[role="radio"], input[type="radio"]',
  );
  expect(radios).toHaveLength(2);
  const cards = () =>
    [...view.container.querySelectorAll<HTMLElement>('[role="radio"], input[type="radio"]')].map(
      (radio) => radio.closest<HTMLElement>('label, .card')!,
    );
  const selected = cards()[0]!;
  const unselected = cards()[1]!;
  expect(getComputedStyle(selected).borderTopWidth).toBe('2px');
  expect(getComputedStyle(unselected).borderTopWidth).toBe('2px');
  expect(getComputedStyle(selected).boxShadow).not.toBe('none');
  const selectedColor = getComputedStyle(selected).borderTopColor;
  const unselectedColor = getComputedStyle(unselected).borderTopColor;
  expect(selectedColor).not.toBe(unselectedColor);

  await view.rerender({ ...props, schema: { ...props.schema, minLength: 2 } });
  await vi.waitFor(() =>
    expect(getComputedStyle(cards()[0]!).borderTopColor).not.toBe(selectedColor),
  );
  expect(getComputedStyle(cards()[1]!).borderTopColor).toBe(
    getComputedStyle(cards()[0]!).borderTopColor,
  );
  const group = view.container.querySelector<HTMLElement>('[role="radiogroup"]')!;
  const help = view.container.querySelector<HTMLElement>('[id$="-help"]')!;
  expect(help.textContent?.trim()).toBeTruthy();
  expect(group.getAttribute('aria-describedby')?.split(' ')).toContain(help.id);
});

it('uses translated labels and swaps selected card presentation without changing choice identity', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { enum: [false, 1, 2] },
      data: false,
      renderers: shadcnRenderers,
      onchange,
      i18n: {
        locale: 'en',
        translate: (key: string, fallback?: string) =>
          key === 'off.label' ? 'Localized Off' : (fallback ?? key),
      },
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          format: 'cards',
          choices: [
            { value: false, label: 'Off', i18n: 'off' },
            {
              value: 1,
              label: 'One',
              content: { type: 'Label', text: 'Idle' },
              selectedContent: { type: 'Label', text: 'Selected' },
            },
            { value: 2, label: 'Two', disabled: true },
          ],
        },
      },
    },
  });
  await expect.element(page.getByRole('radio', { name: 'Localized Off' })).toBeChecked();
  expect(view.container.textContent).toContain('Idle');
  await page.getByText('One', { exact: true }).first().click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe(1));
  expect(view.container.textContent).toContain('Selected');
  await expect.element(page.getByText('Idle', { exact: true })).not.toBeVisible();
});

it('reports duplicate and unknown card identifiers without applying them', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const ondiagnostic = vi.fn();
  try {
    const view = await render(JsonForms, {
      props: {
        schema: { enum: ['A', 'B'] },
        data: 'A',
        renderers: shadcnRenderers,
        ondiagnostic,
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            format: 'cards',
            choices: [
              { value: 'A', label: 'First' },
              { value: 'A', label: 'Duplicate' },
              { value: 'C', label: 'Unknown' },
            ],
          },
        },
      },
    });
    await vi.waitFor(() =>
      expect(
        warn.mock.calls.filter(
          ([code]) => code === 'choice.duplicateIdentifier' || code === 'choice.invalidIdentifier',
        ),
      ).toHaveLength(2),
    );
    expect(warn.mock.calls).toContainEqual([
      'choice.duplicateIdentifier',
      {
        severity: 'warning',
        message: 'Several authored choices identify the same selectable value or branch.',
        path: '',
        details: { index: 1 },
      },
    ]);
    expect(warn.mock.calls).toContainEqual([
      'choice.invalidIdentifier',
      {
        severity: 'warning',
        message: 'The choice identifier does not match a selectable value or branch.',
        path: '',
        details: { index: 2 },
      },
    ]);
    expect(view.container.textContent).toContain('First');
    expect(view.container.textContent).not.toContain('Duplicate');
    expect(view.container.textContent).not.toContain('Unknown');
    await view.rerender({
      uischema: {
        type: 'Control',
        scope: '#',
        options: { format: 'cards', choices: [{ value: 'A', label: 'First' }] },
      },
    });
    await view.rerender({
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          format: 'cards',
          choices: [
            { value: 'A', label: 'First' },
            { value: 'A', label: 'Duplicate' },
            { value: 'C', label: 'Unknown' },
          ],
        },
      },
    });
    await vi.waitFor(() =>
      expect(
        ondiagnostic.mock.calls.filter(
          ([diagnostic]) =>
            diagnostic.code === 'choice.duplicateIdentifier' ||
            diagnostic.code === 'choice.invalidIdentifier',
        ),
      ).toHaveLength(4),
    );
  } finally {
    warn.mockRestore();
  }
});

it('keeps card orientation and radio-circle visibility local to the Control', async () => {
  const uischema: ControlElement = {
    type: 'Control',
    scope: '#',
    options: { format: 'cards' },
  };
  const props = {
    schema: { enum: ['A', 'B'] },
    data: 'A',
    config: { vertical: true, showRadio: true },
    uischema,
    renderers: shadcnRenderers,
  };
  const view = await render(JsonForms, { props });
  const group = view.container.querySelector<HTMLElement>('[role="radiogroup"]');
  expect(group?.getAttribute('aria-orientation')).toBe('horizontal');
  expect(group?.querySelector('[role="radio"]')?.classList.contains('sr-only')).toBe(true);

  await view.rerender({
    ...props,
    uischema: {
      ...uischema,
      options: { format: 'cards', vertical: true, showRadio: true },
    },
  });
  await vi.waitFor(() => expect(group?.getAttribute('aria-orientation')).toBe('vertical'));
  expect(group?.querySelector('[role="radio"]')?.classList.contains('sr-only')).toBe(false);
});

it('selects typed values and explicit null, retaining reloaded structural identity', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: { enum: [{ id: 1 }, false, null] },
      data: { id: 1 },
      renderers: shadcnRenderers,
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
      renderers: shadcnRenderers,
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
    renderers: shadcnRenderers,
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
      renderers: shadcnRenderers,
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
      renderers: shadcnRenderers,
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
    renderers: shadcnRenderers,
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
      renderers: shadcnRenderers,
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

it('cancels a pending branch change when a referenced branch definition changes', async () => {
  const onchange = vi.fn();
  const branch = (title: string, noteDefault?: string): JsonSchema7 => ({
    type: 'object',
    title,
    required: ['kind'],
    properties: {
      kind: { const: title, default: title },
      note: { type: 'string', default: noteDefault },
    },
  });
  const schema: JsonSchema7 = {
    type: 'object',
    properties: {
      plan: { oneOf: [{ $ref: '#/definitions/first' }, { $ref: '#/definitions/second' }] },
    },
    definitions: { first: branch('First'), second: branch('Second', 'old default') },
  };
  const props = {
    schema,
    data: { plan: { kind: 'First', note: 'original' } },
    renderers: shadcnRenderers,
    uischema: {
      type: 'Control',
      scope: '#/properties/plan',
      options: { format: 'cards', confirmation: { branchChange: 'always' } },
    },
    onchange,
  };
  const view = await render(JsonForms, { props });
  await page.getByText('Second', { exact: true }).click();
  await expect.element(page.getByRole('button', { name: 'Yes', exact: true })).toBeVisible();
  await view.rerender({
    ...props,
    schema: {
      ...schema,
      definitions: { ...schema.definitions, second: branch('Second', 'new default') },
    },
  });
  await expect
    .element(page.getByRole('button', { name: 'Yes', exact: true }))
    .not.toBeInTheDocument();
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
});

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
        renderers: shadcnRenderers,
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
