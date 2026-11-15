import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { skeletonRenderers, skeletonCells } from '../../src/lib';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import type { JsonSchema } from '@jsonforms/core';
import fixtureTranslations from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/translations.json';
import { createTranslator } from '../../../jsonforms-svelte-demo-common/src/lib/i18n/i18n';

it.each(['en', 'bg'] as const)(
  'uses the spec rename catalog and reports a duplicate name in %s',
  async (locale) => {
    const { props, view, open, renameInput } = await setup(locale);
    const catalog = {
      en: { ...fixtureTranslations.en, 'combinator.cancel': 'Leave dialog' },
      bg: { ...fixtureTranslations.bg, 'combinator.cancel': 'Затваряне' },
    };
    await view.rerender({
      ...props,
      i18n: { locale, translate: createTranslator(locale, catalog) },
    });
    const originalRow = view.container.querySelector('[data-additional-properties]');
    expect(
      originalRow?.querySelector(
        '[aria-label="' +
          fixtureTranslations[locale]['additionalProperties.renameNamed'].replace(
            '{name}',
            'original',
          ) +
          '"]',
      ),
    ).not.toBeNull();
    expect(
      originalRow?.querySelector(
        '[aria-label="' +
          fixtureTranslations[locale]['additionalProperties.deleteNamed'].replace(
            '{name}',
            'original',
          ) +
          '"]',
      ),
    ).not.toBeNull();
    await open();
    const dialog = page.getByRole('dialog');
    await expect
      .element(dialog.getByText(fixtureTranslations[locale]['additionalProperties.renameTitle']))
      .toBeVisible();
    await expect
      .element(dialog.getByRole('textbox'))
      .toHaveAttribute(
        'placeholder',
        fixtureTranslations[locale]['additionalProperties.namePlaceholder'],
      );
    await expect
      .element(dialog.getByRole('button', { name: catalog[locale]['combinator.cancel'] }))
      .toBeVisible();
    await expect
      .element(
        dialog.getByRole('button', {
          name: fixtureTranslations[locale]['additionalProperties.renameConfirm'],
        }),
      )
      .toBeVisible();
    renameInput()!.value = 'neighbor';
    renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    await expect
      .element(dialog.getByRole('alert'))
      .toHaveTextContent(
        fixtureTranslations[locale]['additionalProperties.nameTaken'].replace('{name}', 'neighbor'),
      );
  },
);

it.each(['en', 'bg'] as const)(
  'uses the spec duplicate-name catalog for Add in %s',
  async (locale) => {
    const { props, view, text } = await setup(locale);
    await view.rerender({
      ...props,
      i18n: { locale, translate: createTranslator(locale, fixtureTranslations) },
    });
    await page
      .getByRole('textbox', { name: text('additionalProperties.propertyNameLabel') })
      .fill('original');
    await expect
      .element(
        page.getByText(
          fixtureTranslations[locale]['additionalProperties.nameTaken'].replace(
            '{name}',
            'original',
          ),
        ),
      )
      .toBeVisible();
  },
);

afterEach(cleanup);
async function setup(locale: 'en' | 'bg' = 'en', required = false) {
  const onchange = vi.fn();
  const props = {
    schema: {
      type: 'object',
      properties: {
        value: {
          type: 'object',
          additionalProperties: { type: 'string', default: 'new' },
          ...(required ? { required: ['original'] } : {}),
        },
      },
    } as JsonSchema,
    uischema: { type: 'Control', scope: '#/properties/value', options: { restrict: true } },
    data: { value: { original: 'before', neighbor: 'keep' }, sibling: 'keep' },
    i18n: { locale },
    renderers: skeletonRenderers,
    cells: skeletonCells,
    onchange,
  };
  const view = await render(JsonForms, { props });
  const text = (key: keyof typeof messages.en) => messages[locale][key];
  const buttons = () => [...view.container.querySelectorAll<HTMLButtonElement>('button')];
  const rename = () =>
    buttons()
      .find(
        (node) =>
          node.getAttribute('aria-label') ===
          text('additionalProperties.renameNamed').replace('{name}', 'original'),
      )!
      .click();
  const add = () =>
    buttons()
      .find(
        (node) =>
          node.getAttribute('aria-label') === text('additionalProperties.addAriaLabel') ||
          node
            .getAttribute('aria-label')
            ?.startsWith(text('additionalProperties.addTo').split('{label}')[0]),
      )!
      .click();
  const input = () =>
    [...view.container.querySelectorAll<HTMLInputElement>('input')].find(
      (node) => node.value === 'before' || node.value === 'draft',
    )!;
  const renameInput = () => {
    const node = document.querySelector<HTMLInputElement>('[id$="-rename-property"]');
    return node?.checkVisibility() ? node : null;
  };
  const submit = () => renameInput()!.closest('form')!.requestSubmit();
  const open = async () => {
    rename();
    await expect.poll(() => !!renameInput()).toBe(true);
  };
  return { props, view, text, input, rename, add, renameInput, submit, open, onchange };
}
it.each(['en', 'bg'] as const)(
  'flushes drafts before rename and preserves literal keys and siblings in %s',
  async (locale) => {
    const { input, open, renameInput, submit, onchange } = await setup(locale);
    input().value = 'draft';
    input().dispatchEvent(new InputEvent('input', { bubbles: true }));
    await open();
    renameInput()!.value = 'literal.key';
    renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    submit();
    submit();
    await expect
      .poll(() => onchange.mock.lastCall?.[0].data)
      .toEqual({ value: { 'literal.key': 'draft', neighbor: 'keep' }, sibling: 'keep' });
  },
);
it('blocks opening rename during value composition and retries', async () => {
  const { props, input, rename, renameInput, open, onchange } = await setup();
  input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input().value = 'draft';
  input().dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  rename();
  await new Promise(requestAnimationFrame);
  expect(renameInput()).toBeNull();
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
  input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  await open();
  expect(onchange.mock.lastCall?.[0].data.value.original).toBe('draft');
});
it('blocks submitting a composing name and retries without losing the value', async () => {
  const { props, open, renameInput, submit, onchange } = await setup();
  await open();
  renameInput()!.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  renameInput()!.value = 'renamed';
  renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  submit();
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
  renameInput()!.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  submit();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({ value: { renamed: 'before', neighbor: 'keep' }, sibling: 'keep' });
});
it('rejects collisions without overwriting existing values', async () => {
  const { props, open, renameInput, submit, onchange } = await setup();
  await open();
  renameInput()!.value = 'neighbor';
  renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
  submit();
  await expect.element(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
});
it.each(['readonly', 'schema', 'removed'])(
  'invalidates an open rename on %s changes',
  async (reason) => {
    const { props, view, open, renameInput, onchange } = await setup();
    await open();
    const data =
      reason === 'removed' ? { value: { neighbor: 'keep' }, sibling: 'keep' } : props.data;
    await view.rerender({
      ...props,
      data,
      readonly: reason === 'readonly',
      schema: reason === 'schema' ? { ...props.schema, title: 'Replacement' } : props.schema,
    });
    await expect.poll(() => !!renameInput()).toBe(false);
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  },
);
it('prevents removing a required key by rename under restrict', async () => {
  const { props, rename, renameInput, onchange } = await setup('en', true);
  rename();
  await new Promise(requestAnimationFrame);
  expect(renameInput()).toBeNull();
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
});
it.each(['en', 'bg'] as const)(
  'adds one literal property after flushing drafts in %s',
  async (locale) => {
    const { text, input, add, onchange } = await setup(locale);
    await page
      .getByRole('textbox', { name: text('additionalProperties.propertyNameLabel'), exact: true })
      .fill('new.key');
    (
      page
        .getByRole('textbox', { name: text('additionalProperties.propertyNameLabel'), exact: true })
        .element() as HTMLInputElement
    ).blur();
    await new Promise(requestAnimationFrame);
    input().value = 'draft';
    input().dispatchEvent(new InputEvent('input', { bubbles: true }));
    add();
    add();
    await expect
      .poll(() => onchange.mock.lastCall?.[0].data)
      .toEqual({
        value: { original: 'draft', neighbor: 'keep', 'new.key': 'new' },
        sibling: 'keep',
      });
  },
);
it('blocks add during value composition and retries', async () => {
  const { props, text, input, add, onchange } = await setup();
  await page
    .getByRole('textbox', { name: text('additionalProperties.propertyNameLabel'), exact: true })
    .fill('added');
  (
    page
      .getByRole('textbox', { name: text('additionalProperties.propertyNameLabel'), exact: true })
      .element() as HTMLInputElement
  ).blur();
  await new Promise(requestAnimationFrame);
  input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  input().value = 'draft';
  input().dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  add();
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
  input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  add();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({ value: { original: 'draft', neighbor: 'keep', added: 'new' }, sibling: 'keep' });
});
it.each(['readonly', 'schema', 'option'])(
  'rechecks %s before adding a property',
  async (reason) => {
    const { props, view, text, add, onchange } = await setup();
    await page
      .getByRole('textbox', { name: text('additionalProperties.propertyNameLabel'), exact: true })
      .fill('added');
    (
      page
        .getByRole('textbox', { name: text('additionalProperties.propertyNameLabel'), exact: true })
        .element() as HTMLInputElement
    ).blur();
    await new Promise(requestAnimationFrame);
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
  },
);
it.each([true, false])('honors maxProperties with restrict=%s', async (restrict) => {
  const { props, view, text, add, onchange } = await setup();
  await view.rerender({
    ...props,
    schema: {
      ...props.schema,
      properties: { value: { ...props.schema.properties!.value, maxProperties: 2 } },
    } as JsonSchema,
    uischema: { ...props.uischema, options: { restrict } },
  });
  await page
    .getByRole('textbox', { name: text('additionalProperties.propertyNameLabel'), exact: true })
    .fill('added');
  (
    page
      .getByRole('textbox', { name: text('additionalProperties.propertyNameLabel'), exact: true })
      .element() as HTMLInputElement
  ).blur();
  await new Promise(requestAnimationFrame);
  add();
  await new Promise(requestAnimationFrame);
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual(
      restrict
        ? props.data
        : { value: { original: 'before', neighbor: 'keep', added: 'new' }, sibling: 'keep' },
    );
});
it('blocks add while the property name is composing', async () => {
  const { props, text, add, onchange } = await setup();
  const name = page.getByRole('textbox', {
    name: text('additionalProperties.propertyNameLabel'),
    exact: true,
  });
  await name.fill('added');
  (name.element() as HTMLInputElement).blur();
  await new Promise(requestAnimationFrame);
  const node = name.element() as HTMLInputElement;
  node.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  node.value = 'composed';
  node.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  add();
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
  node.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  add();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({ value: { original: 'before', neighbor: 'keep', composed: 'new' }, sibling: 'keep' });
});
it.each(['add', 'rename'])('cancels pending property %s on unmount', async (action) => {
  const { props, view, text, add, open, renameInput, submit, onchange } = await setup();
  if (action === 'add') {
    const name = page.getByRole('textbox', {
      name: text('additionalProperties.propertyNameLabel'),
      exact: true,
    });
    await name.fill('added');
    (name.element() as HTMLInputElement).blur();
    await new Promise(requestAnimationFrame);
    add();
  } else {
    await open();
    renameInput()!.value = 'renamed';
    renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    submit();
  }
  await view.unmount();
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
});
it('allows required-key rename with restrict=false and preserves the value', async () => {
  const { props, view, open, renameInput, submit, onchange } = await setup('en', true);
  await view.rerender({ ...props, uischema: { ...props.uischema, options: { restrict: false } } });
  await open();
  renameInput()!.value = 'renamed';
  renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
  submit();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({ value: { renamed: 'before', neighbor: 'keep' }, sibling: 'keep' });
  expect(
    onchange.mock.lastCall?.[0].errors.some(
      (error: { keyword: string }) => error.keyword === 'required',
    ),
  ).toBe(true);
});
it('gives simultaneous property editors distinct rename label targets', async () => {
  const { props, view, text } = await setup();
  await view.rerender({
    ...props,
    schema: {
      ...props.schema,
      properties: {
        ...props.schema.properties,
        other: { type: 'object', additionalProperties: { type: 'string' } },
      },
    } as JsonSchema,
    data: { ...props.data, other: { second: 'keep' } },
    uischema: {
      type: 'VerticalLayout',
      elements: [props.uischema, { type: 'Control', scope: '#/properties/other' }],
    },
  });
  const rename = page.getByRole('button', {
    name: new RegExp('^' + text('additionalProperties.renameNamed').split('{name}')[0]),
    exact: true,
  });
  await rename.first().click();
  const first = page.getByRole('dialog').getByRole('textbox', {
    name: text('additionalProperties.renamePropertyNameLabel'),
    exact: true,
  });
  await expect.element(first).toHaveValue('original');
  const firstId = first.element().id;
  await page
    .getByRole('dialog')
    .getByRole('button', { name: text('additionalProperties.renameDialogDecline'), exact: true })
    .click();
  await rename.last().click();
  const second = page.getByRole('dialog').getByRole('textbox', {
    name: text('additionalProperties.renamePropertyNameLabel'),
    exact: true,
  });
  await expect.element(second).toHaveValue('second');
  expect(second.element().id).not.toBe(firstId);
  const ids = [...document.querySelectorAll<HTMLInputElement>('[id$="-rename-property"]')].map(
    (node) => node.id,
  );
  expect(new Set(ids).size).toBe(ids.length);
});
