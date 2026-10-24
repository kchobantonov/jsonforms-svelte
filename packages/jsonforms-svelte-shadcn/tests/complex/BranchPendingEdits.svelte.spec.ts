import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
import { shadcnRenderers } from '../../src/lib/renderers';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import type { JsonSchema } from '@jsonforms/core';

afterEach(cleanup);

const schemas: Record<string, JsonSchema> = {
  oneOf: {
    oneOf: ['First', 'Second'].map((title) => ({
      type: 'object',
      title,
      required: ['kind'],
      properties: { kind: { const: title, default: title }, note: { type: 'string' } },
    })),
  },
  mixed: { type: ['object', 'string'], properties: { note: { type: 'string' } } },
};

async function setup(
  mode: 'oneOf' | 'mixed',
  locale: 'en' | 'bg',
  policy = 'complex',
  value: unknown = mode === 'oneOf' ? { kind: 'First' } : {},
) {
  const onchange = vi.fn();
  const onvaliditychange = vi.fn();
  const props = {
    schema: { type: 'object', properties: { value: schemas[mode] } } as JsonSchema,
    data: { value, sibling: 'keep' },
    uischema: {
      type: 'Control',
      scope: '#/properties/value',
      options: {
        structuredLayout: 'nested',
        confirmation: { branchChange: policy, typeChange: policy },
      },
    },
    renderers: shadcnRenderers,
    i18n: { locale },
    onchange,
    onvaliditychange,
  };
  const view = await render(JsonForms, { props });
  const clear = () => {
    const label = messages[locale][mode === 'mixed' ? 'mixed.clearType' : 'control.clearValue'];
    const button = [...view.container.querySelectorAll<HTMLButtonElement>('button')].find(
      (node) => node.getAttribute('aria-label') === label,
    );
    expect(button).toBeTruthy();
    button!.click();
  };
  return { view, props, onchange, onvaliditychange, clear };
}

for (const mode of ['oneOf', 'mixed'] as const) {
  it.each(['en', 'bg'] as const)(
    `resolves ${mode} completed drafts before confirmation in %s`,
    async (locale) => {
      const { view, onchange, clear } = await setup(mode, locale);
      const input = view.container.querySelector<HTMLInputElement>(
        'input[id*="/properties/note"]',
      )!;
      input.value = 'new note';
      input.dispatchEvent(new InputEvent('input', { bubbles: true }));
      clear(); // No blur: the action must flush the draft itself.
      await expect
        .element(
          page.getByRole('button', {
            name: messages[locale]['combinator.clearDialogDecline'],
            exact: true,
          }),
        )
        .toBeVisible();
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        value: { ...(mode === 'oneOf' ? { kind: 'First' } : {}), note: 'new note' },
        sibling: 'keep',
      });
      await page
        .getByRole('button', {
          name: messages[locale]['combinator.clearDialogDecline'],
          exact: true,
        })
        .click();
      await expect
        .element(
          page.getByRole('button', {
            name: messages[locale]['combinator.clearDialogDecline'],
            exact: true,
          }),
        )
        .not.toBeInTheDocument();
      expect(input.value).toBe('new note');
      clear();
      await page
        .getByRole('button', {
          name: messages[locale]['combinator.clearDialogAccept'],
          exact: true,
        })
        .click();
      await expect.poll(() => onchange.mock.lastCall?.[0].data).toEqual({ sibling: 'keep' });
    },
  );

  it(`blocks ${mode} changes during composition and allows a fresh retry`, async () => {
    const { view, onchange, onvaliditychange, clear } = await setup(mode, 'en', 'never');
    const input = view.container.querySelector<HTMLInputElement>('input[id*="/properties/note"]')!;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = '日本';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await expect.poll(() => onvaliditychange.mock.lastCall?.[0].pending).toBe(true);
    clear();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      value: mode === 'oneOf' ? { kind: 'First' } : {},
      sibling: 'keep',
    });
    expect(input.isConnected).toBe(true);
    expect(input.value).toBe('日本');
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    clear();
    await expect.poll(() => onchange.mock.lastCall?.[0].data).toEqual({ sibling: 'keep' });
  });
}

// Comparable to React Antd confirmationRenderers: inspect the discarded value,
// honor always/never/complex, and preserve siblings through confirmed clearing.
it.each([
  { mode: 'mixed' as const, value: 'simple', policy: 'complex', prompts: false },
  { mode: 'mixed' as const, value: {}, policy: 'complex', prompts: false },
  { mode: 'mixed' as const, value: 'simple', policy: 'always', prompts: true },
  { mode: 'mixed' as const, value: { note: 'keep' }, policy: 'never', prompts: false },
  { mode: 'oneOf' as const, value: { kind: 'First' }, policy: 'complex', prompts: false },
  {
    mode: 'oneOf' as const,
    value: { kind: 'First', note: 'keep' },
    policy: 'always',
    prompts: true,
  },
])('$mode clear honors $policy for $value', async ({ mode, value, policy, prompts }) => {
  const { clear, onchange } = await setup(mode, 'en', policy, value);
  clear();
  if (prompts) {
    await expect.element(page.getByRole('button', { name: 'Yes', exact: true })).toBeVisible();
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value, sibling: 'keep' });
    await page.getByRole('button', { name: 'Yes', exact: true }).click();
  }
  await expect.poll(() => onchange.mock.lastCall?.[0].data).toEqual({ sibling: 'keep' });
});

it.each(['replacement', 'readonly', 'schema'] as const)(
  'invalidates a oneOf confirmation after %s changes',
  async (reason) => {
    const { clear, view, props, onchange } = await setup('oneOf', 'en', 'always', {
      kind: 'First',
      note: 'original',
    });
    clear();
    await expect.element(page.getByRole('button', { name: 'Yes', exact: true })).toBeVisible();
    const data =
      reason === 'replacement'
        ? { value: { kind: 'First', note: 'replacement' }, sibling: 'keep' }
        : props.data;
    await view.rerender({
      ...props,
      data,
      readonly: reason === 'readonly',
      schema: reason === 'schema' ? { ...props.schema, title: 'Replacement schema' } : props.schema,
    });
    await expect
      .element(page.getByRole('button', { name: 'Yes', exact: true }))
      .not.toBeInTheDocument();
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  },
);

it.each(['oneOf', 'mixed'] as const)(
  'blocks an actual %s selector change during composition and retries',
  async (mode) => {
    const { view, onchange, onvaliditychange } = await setup(mode, 'en', 'never');
    const input = view.container.querySelector<HTMLInputElement>('input[id*="/properties/note"]')!;
    const choose = async () => {
      const select = view.container.querySelector<HTMLSelectElement>('select');
      const label = mode === 'oneOf' ? 'Second' : 'string';
      if (select) {
        const option = [...select.options].find(
          (item) => item.textContent?.trim().toLowerCase() === label.toLowerCase(),
        );
        expect(option).toBeTruthy();
        select.value = option!.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      } else {
        const trigger = view.container.querySelector<HTMLButtonElement>(
          'button[aria-haspopup="listbox"]',
        )!;
        await page.elementLocator(trigger).click();
        await page.getByRole('option', { name: label, exact: true }).click();
      }
    };
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'draft';
    input.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
    await expect.poll(() => onvaliditychange.mock.lastCall?.[0].pending).toBe(true);
    await choose();
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(input.isConnected).toBe(true);
    expect(input.value).toBe('draft');
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      value: mode === 'oneOf' ? { kind: 'First' } : {},
      sibling: 'keep',
    });
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await choose();
    await expect
      .poll(() => onchange.mock.lastCall?.[0].data)
      .toEqual({ value: mode === 'oneOf' ? { kind: 'Second' } : '', sibling: 'keep' });
  },
);

it('replaces a oneOf schema while confirmation is open without reviving its action', async () => {
  const { clear, view, props, onchange } = await setup('oneOf', 'en', 'always', {
    kind: 'First',
    note: 'original',
  });
  clear();
  await expect.element(page.getByRole('button', { name: 'Yes', exact: true })).toBeVisible();
  const data = { value: 'replacement', sibling: 'keep' };
  await view.rerender({
    ...props,
    schema: { type: 'object', properties: { value: { type: 'string' } } },
    data,
  });
  await expect
    .element(page.getByRole('button', { name: 'Yes', exact: true }))
    .not.toBeInTheDocument();
  await expect.element(page.getByRole('textbox')).toHaveValue('replacement');
  expect(onchange.mock.lastCall?.[0].data).toEqual(data);
});
