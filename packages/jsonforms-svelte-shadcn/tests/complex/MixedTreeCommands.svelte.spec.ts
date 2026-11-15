import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import type { JsonSchema } from '@jsonforms/core';
import fixtureTranslations from '@chobantonov/jsonforms-extended-spec/examples/additional-properties/translations.json';
import { createTranslator } from '../../../jsonforms-svelte-demo-common/src/lib/i18n/i18n';

afterEach(cleanup);
async function setup(locale: 'en' | 'bg' = 'en', policy = 'never') {
  const onchange = vi.fn();
  const props = {
    schema: {
      type: 'object',
      properties: {
        value: {
          type: ['object', 'null'],
          additionalProperties: { type: 'object', properties: { note: { type: 'string' } } },
        },
      },
    } as JsonSchema,
    uischema: {
      type: 'Control',
      scope: '#/properties/value',
      options: { restrict: true, confirmation: { delete: policy } },
    },
    data: { value: { first: { note: 'before' }, neighbor: { note: 'keep' } }, sibling: 'keep' },
    i18n: { locale },
    renderers: shadcnRenderers,
    cells: shadcnCells,
    onchange,
  };
  const view = await render(JsonForms, { props });
  const text = (key: keyof typeof messages.en) => messages[locale][key];
  const buttons = (key: 'mixed.rename' | 'mixed.delete') =>
    [...view.container.querySelectorAll<HTMLButtonElement>('[role="tree"] button')].filter(
      (node) => node.title === text(key),
    );
  await vi.waitFor(() => {
    if (!buttons('mixed.rename').length) {
      const root = view.container.querySelector<HTMLElement>('[role="treeitem"]');
      (
        root?.querySelector<HTMLElement>('[role="button"][aria-label="Expand"]') ??
        root?.querySelector<HTMLElement>('button') ??
        root
      )?.click();
    }
    expect(buttons('mixed.rename').length).toBeGreaterThan(0);
  });
  buttons('mixed.rename')[0].closest<HTMLElement>('[role="treeitem"]')!.click();
  const input = () =>
    [...view.container.querySelectorAll<HTMLInputElement>('input')].find(
      (node) => node.value === 'before' || node.value === 'draft',
    )!;
  await expect.poll(() => !!input()).toBe(true);
  await expect
    .poll(
      () =>
        page.getByRole('navigation', { name: text('mixed.navigationPath'), exact: true }).element()
          .textContent,
    )
    .toContain('first');
  const rename = () => buttons('mixed.rename')[0].click();
  const remove = () => buttons('mixed.delete')[0].click();
  const renameInput = () =>
    view.container.querySelector<HTMLInputElement>('input[data-tree-rename]');
  const open = async () => {
    rename();
    await expect.poll(() => !!renameInput()).toBe(true);
  };
  const commit = () =>
    renameInput()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  return { props, view, text, input, rename, remove, renameInput, open, commit, onchange };
}

it('retains selected detail when a rename hides its tree row under search', async () => {
  const { view, text, input, renameInput, open, commit, onchange } = await setup();
  const search = page.getByPlaceholder(text('mixed.searchPlaceholder'), { exact: true });
  await search.fill('first');
  await open();
  renameInput()!.value = 'renamed';
  renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
  commit();
  await expect.poll(() => (search.element() as HTMLInputElement).value).toBe('first');
  await expect
    .poll(() => view.container.querySelector('[role="treeitem"][aria-selected="true"]'))
    .toBeNull();
  await expect.poll(() => input()?.value).toBe('before');
  await expect
    .poll(
      () =>
        page.getByRole('navigation', { name: text('mixed.navigationPath') }).element().textContent,
    )
    .toContain('renamed');
  expect(onchange.mock.lastCall?.[0].data.value.renamed.note).toBe('before');
  await search.fill('renamed');
  await expect
    .poll(
      () => view.container.querySelector('[role="treeitem"][aria-selected="true"]')?.textContent,
    )
    .toContain('renamed');
});
it.each(['en', 'bg'] as const)(
  'flushes tree detail drafts before literal-key rename in %s',
  async (locale) => {
    const { input, open, renameInput, commit, onchange } = await setup(locale);
    input().value = 'draft';
    input().dispatchEvent(new InputEvent('input', { bubbles: true }));
    await open();
    renameInput()!.value = 'literal.key';
    renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    commit();
    commit();
    await expect
      .poll(() => onchange.mock.lastCall?.[0].data)
      .toEqual({
        value: { 'literal.key': { note: 'draft' }, neighbor: { note: 'keep' } },
        sibling: 'keep',
      });
    await expect
      .poll(
        () =>
          page
            .getByRole('navigation', {
              name: messages[locale]['mixed.navigationPath'],
              exact: true,
            })
            .element().textContent,
      )
      .toContain('literal.key');
  },
);
it.each(['rename', 'delete'])(
  'blocks tree %s during detail composition and permits retry',
  async (action) => {
    const { props, input, rename, remove, renameInput, open, onchange } = await setup();
    input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input().value = 'draft';
    input().dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    (action === 'rename' ? rename : remove)();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
    expect(renameInput()).toBeNull();
    input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    if (action === 'rename') {
      await open();
      expect(onchange.mock.lastCall?.[0].data.value.first.note).toBe('draft');
    } else {
      remove();
      await expect
        .poll(() => onchange.mock.lastCall?.[0].data)
        .toEqual({ value: { neighbor: { note: 'keep' } }, sibling: 'keep' });
      await expect
        .poll(
          () =>
            page
              .getByRole('navigation', { name: messages.en['mixed.navigationPath'], exact: true })
              .element().textContent,
        )
        .not.toContain('first');
    }
  },
);
it('blocks composing names and allows Escape without a late rename', async () => {
  const { props, open, renameInput, commit, onchange } = await setup();
  await open();
  renameInput()!.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  renameInput()!.value = 'renamed';
  renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  commit();
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
  renameInput()!.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  renameInput()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  await expect.poll(() => !!renameInput()).toBe(false);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
});
it('preserves the flushed detail draft when deletion is declined', async () => {
  const { input, remove, text, onchange } = await setup('en', 'always');
  input().value = 'draft';
  input().dispatchEvent(new InputEvent('input', { bubbles: true }));
  remove();
  remove();
  await page.getByRole('button', { name: text('confirm.decline'), exact: true }).click();
  await expect
    .poll(() => onchange.mock.lastCall?.[0].data)
    .toEqual({ value: { first: { note: 'draft' }, neighbor: { note: 'keep' } }, sibling: 'keep' });
});
it.each(['readonly', 'schema', 'removed'])(
  'invalidates tree rename on %s changes',
  async (reason) => {
    const { props, view, open, renameInput, commit, onchange } = await setup();
    await open();
    renameInput()!.value = 'renamed';
    renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    commit();
    const data =
      reason === 'removed'
        ? { value: { neighbor: { note: 'keep' } }, sibling: 'keep' }
        : props.data;
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
it.each(['readonly', 'schema', 'data'])(
  'cancels tree delete confirmation on %s changes',
  async (reason) => {
    const { props, view, remove, text, onchange } = await setup('en', 'always');
    remove();
    await expect
      .element(page.getByRole('button', { name: text('confirm.accept'), exact: true }))
      .toBeVisible();
    const data =
      reason === 'data'
        ? {
            value: { first: { note: 'host replacement' }, neighbor: { note: 'keep' } },
            sibling: 'keep',
          }
        : props.data;
    await view.rerender({
      ...props,
      data,
      readonly: reason === 'readonly',
      schema: reason === 'schema' ? { ...props.schema, title: 'Replacement' } : props.schema,
    });
    await expect
      .poll(
        () =>
          [...document.querySelectorAll<HTMLElement>('[role="dialog"]')].filter((node) =>
            node.checkVisibility(),
          ).length,
      )
      .toBe(0);
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  },
);
it.each(['en', 'bg'] as const)(
  'reports localized rename collisions and accepts a corrected name in %s',
  async (locale) => {
    const { props, view, open, renameInput, commit, onchange } = await setup(locale);
    await view.rerender({
      ...props,
      i18n: { locale, translate: createTranslator(locale, fixtureTranslations) },
    });
    await open();
    renameInput()!.value = 'neighbor';
    renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    commit();
    await expect.poll(() => renameInput()?.getAttribute('aria-invalid')).toBe('true');
    expect(view.container.querySelector('[role="tree"] [role="alert"]')).toBeTruthy();
    await expect
      .poll(() =>
        [...view.container.querySelectorAll('[role="tree"] [role="alert"]')].some((node) =>
          node.textContent?.includes(
            fixtureTranslations[locale]['additionalProperties.nameTaken'].replace(
              '{name}',
              'neighbor',
            ),
          ),
        ),
      )
      .toBe(true);
    expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
    renameInput()!.value = 'renamed';
    renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    commit();
    await expect
      .poll(() => onchange.mock.lastCall?.[0].data)
      .toEqual({
        value: { renamed: { note: 'before' }, neighbor: { note: 'keep' } },
        sibling: 'keep',
      });
  },
);
it.each(['required', 'minProperties', 'disableRemove'])(
  'honors tree deletion constraint %s',
  async (constraint) => {
    const { props, view, text, onchange } = await setup();
    await view.rerender({
      ...props,
      schema: {
        ...props.schema,
        properties: {
          value: {
            ...props.schema.properties!.value,
            ...(constraint === 'required'
              ? { required: ['first'] }
              : constraint === 'minProperties'
                ? { minProperties: 2 }
                : {}),
          },
        },
      } as JsonSchema,
      uischema:
        constraint === 'disableRemove'
          ? { ...props.uischema, options: { ...props.uischema.options, disableRemove: true } }
          : props.uischema,
    });
    const actions = [
      ...view.container.querySelectorAll<HTMLButtonElement>('[role="tree"] button'),
    ].filter((button) => button.title === text('mixed.delete') && !button.disabled);
    expect(actions.length).toBe(constraint === 'required' ? 1 : 0);
    expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
  },
);
it.each(['rename', 'delete'])('cancels tree %s after unmount', async (action) => {
  const { props, view, open, renameInput, commit, remove, onchange } = await setup();
  if (action === 'rename') {
    await open();
    renameInput()!.value = 'renamed';
    renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    commit();
  } else remove();
  await view.unmount();
  await new Promise(requestAnimationFrame);
  expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
});

it.each(['en', 'bg'] as const)(
  'uses portable mixed navigation catalog names in %s',
  async (locale) => {
    const { view, props } = await setup(locale);
    const translated = {
      en: {
        'mixed.searchLabel': 'Find value tree EN',
        'mixed.searchPlaceholder': 'Find nodes EN',
        'mixed.treeLabel': 'Value structure EN',
        'mixed.typeLabel': 'Choose value type EN',
      },
      bg: {
        'mixed.searchLabel': 'Find value tree BG',
        'mixed.searchPlaceholder': 'Find nodes BG',
        'mixed.treeLabel': 'Value structure BG',
        'mixed.typeLabel': 'Choose value type BG',
      },
    };
    await view.rerender({
      ...props,
      i18n: { locale, translate: createTranslator(locale, translated) },
    });
    const suffix = locale.toUpperCase();
    await expect
      .poll(
        () =>
          view.container.querySelector<HTMLInputElement>(
            `input[aria-label="Find value tree ${suffix}"]`,
          )?.placeholder,
      )
      .toBe(`Find nodes ${suffix}`);
    expect(page.getByRole('tree', { name: `Value structure ${suffix}` }).element()).toBeTruthy();
    expect(
      view.container
        .querySelector<HTMLElement>('[id$="-input-selector"]')
        ?.getAttribute('aria-label'),
    ).toBe(`Choose value type ${suffix}`);
  },
);

it.each(['en', 'bg'] as const)(
  'distinguishes a pattern-rejected tree rename in %s',
  async (locale) => {
    const { view, props, open, renameInput, commit, onchange } = await setup(locale);
    const valueSchema = {
      type: ['object', 'null'],
      patternProperties: {
        '^(first|neighbor|allowed-)': {
          type: 'object',
          properties: { note: { type: 'string' } },
        },
      },
      additionalProperties: false,
    } as JsonSchema;
    const catalog = {
      en: { 'additionalProperties.namePattern': 'Pattern mismatch EN' },
      bg: { 'additionalProperties.namePattern': 'Pattern mismatch BG' },
    };
    await view.rerender({
      ...props,
      schema: { type: 'object', properties: { value: valueSchema } } as JsonSchema,
      i18n: { locale, translate: createTranslator(locale, catalog) },
    });
    await open();
    renameInput()!.value = 'outside';
    renameInput()!.dispatchEvent(new InputEvent('input', { bubbles: true }));
    commit();
    await expect
      .poll(() => view.container.textContent)
      .toContain(`Pattern mismatch ${locale.toUpperCase()}`);
    expect(onchange.mock.lastCall?.[0].data).toEqual(props.data);
  },
);
