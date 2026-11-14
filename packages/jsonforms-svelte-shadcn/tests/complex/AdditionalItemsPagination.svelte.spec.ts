import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { shadcnRenderers } from '../../src/lib/renderers';
import { shadcnCells } from '../../src/lib/cells';
import { createSpecAdditionalItemsPaginationExample } from '../../../jsonforms-svelte-demo-common/tests/fixtures/specAdapters/additional-items-pagination';
import data from '@chobantonov/jsonforms-extended-spec/examples/additional-items-pagination/data.json';
import translations from '@chobantonov/jsonforms-extended-spec/examples/additional-items-pagination/translations.json';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);

it('keeps an off-page tuple-tail schema error reachable', async () => {
  const example = createSpecAdditionalItemsPaginationExample(() => 'en');
  const invalidData = structuredClone(data);
  invalidData.manifest[11] = 'X';
  const schema = structuredClone(example.schema) as JsonSchema;
  const manifest = schema.properties?.manifest as JsonSchema;
  manifest.additionalItems = { type: 'string', minLength: 3 };
  const view = await render(JsonForms, {
    props: {
      schema,
      uischema: example.uischema as UISchemaElement,
      data: invalidData,
      config: example.config,
      i18n: example.i18n,
      renderers: shadcnRenderers,
      cells: shadcnCells,
    },
  });
  const tail = () =>
    [...view.container.querySelectorAll<HTMLElement>('.additional-items')].find((element) =>
      element.checkVisibility(),
    )!;
  await vi.waitFor(() => expect(tail().querySelector('[data-additional-item="1"]')).not.toBeNull());
  expect(tail().querySelector('[data-additional-item="11"]')).toBeNull();
  const errorPage = messages.en['collection.errorPage']
    .replace('{page}', '3')
    .replace('{count}', '1');
  await page.getByRole('button', { name: errorPage, exact: true }).click();
  await vi.waitFor(() =>
    expect(tail().querySelector<HTMLInputElement>('[data-additional-item="11"] input')?.value).toBe(
      'X',
    ),
  );
});

it('does not redirect a composing tuple-tail draft after external replacement', async () => {
  const example = createSpecAdditionalItemsPaginationExample(() => 'en');
  const originalData = structuredClone(data);
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: example.schema as JsonSchema,
      uischema: example.uischema as UISchemaElement,
      data: originalData,
      config: example.config,
      i18n: example.i18n,
      renderers: shadcnRenderers,
      cells: shadcnCells,
      onchange,
    },
  });
  const tail = () =>
    [...view.container.querySelectorAll<HTMLElement>('.additional-items')].find((element) =>
      element.checkVisibility(),
    )!;
  const editor = () => tail().querySelector<HTMLInputElement>('[data-additional-item="1"] input');
  await vi.waitFor(() => expect(editor()?.value).toBe('Package 01'));
  const oldEditor = editor()!;
  oldEditor.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
  oldEditor.value = 'Uncommitted draft';
  oldEditor.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  expect(onchange.mock.lastCall?.[0].data).toEqual(originalData);

  const replacement = structuredClone(originalData);
  replacement.manifest.splice(1, 1);
  await view.rerender({ data: replacement });
  await vi.waitFor(() => expect(editor()?.value).toBe('Package 02'));
  oldEditor.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
  await page.getByRole('button', { name: messages.en['collection.next'], exact: true }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(replacement));
  expect(replacement.manifest[1]).toBe('Package 02');
});

it.each(['en', 'bg'] as const)(
  'keeps tail action labels tied to absolute positions after deletion in %s',
  async (locale) => {
    const example = createSpecAdditionalItemsPaginationExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(data),
        config: example.config,
        i18n: example.i18n,
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
      },
    });
    const tail = () =>
      [...view.container.querySelectorAll<HTMLElement>('.additional-items')].find((element) =>
        element.checkVisibility(),
      )!;
    const label = (position: number) =>
      messages[locale]['tuple.position'].replace('{position}', String(position));
    const deleteLabel = (position: number) =>
      messages[locale]['tuple.delete'].replace('{label}', label(position));
    await vi.waitFor(() =>
      expect(
        tail().querySelector<HTMLInputElement>('[data-additional-item="1"] input')?.value,
      ).toBe('Package 01'),
    );
    await page.getByRole('button', { name: deleteLabel(2), exact: true }).click();
    const expected = structuredClone(data);
    expected.manifest.splice(1, 1);
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    await vi.waitFor(() =>
      expect(
        tail().querySelector<HTMLInputElement>('[data-additional-item="1"] input')?.value,
      ).toBe('Package 02'),
    );
    expect(tail().querySelector('[data-additional-item="1"]')?.textContent).toContain(label(2));
    await page
      .getByRole('button', { name: messages[locale]['collection.next'], exact: true })
      .click();
    await vi.waitFor(() =>
      expect(
        tail().querySelector<HTMLInputElement>('[data-additional-item="6"] input')?.value,
      ).toBe('Package 07'),
    );
    expect(tail().querySelector('[data-additional-item="6"]')?.textContent).toContain(label(7));
    expect(
      tail()
        .querySelector('[data-additional-item="6"] .additional-item-actions button[aria-label]')
        ?.getAttribute('aria-label'),
    ).toBe(deleteLabel(7));
  },
);

it.each(['en', 'bg'] as const)(
  'pages canonical tuple tails with absolute indices in %s',
  async (locale) => {
    const example = createSpecAdditionalItemsPaginationExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(data),
        config: example.config,
        i18n: example.i18n,
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
      },
    });
    const tail = () =>
      [...view.container.querySelectorAll<HTMLElement>('.additional-items')].find((element) =>
        element.checkVisibility(),
      )!;
    await vi.waitFor(() =>
      expect(tail().querySelectorAll('[data-additional-item]')).toHaveLength(5),
    );
    expect(tail().querySelector('[data-collection-footer]')).not.toBeNull();
    expect(view.container.querySelector<HTMLInputElement>('input')?.value).toBe('SHIP-104');
    await view.rerender({
      additionalErrors: [
        {
          keyword: 'server',
          instancePath: '/manifest/11',
          schemaPath: '',
          params: {},
          message: 'Check package',
        },
      ],
    });
    const errorPage = messages[locale]['collection.errorPage']
      .replace('{page}', '3')
      .replace('{count}', '1');
    await page.getByRole('button', { name: errorPage, exact: true }).click();
    expect(tail().querySelector('[data-additional-item="11"]')).not.toBeNull();
    await page
      .getByRole('button', { name: messages[locale]['collection.previous'], exact: true })
      .click();
    await page
      .getByRole('button', { name: messages[locale]['collection.previous'], exact: true })
      .click();
    await view.rerender({ additionalErrors: [] });
    const before = onchange.mock.calls.length;
    await page
      .getByRole('button', { name: messages[locale]['collection.next'], exact: true })
      .click();
    expect(onchange.mock.calls.length).toBe(before);
    expect(tail().querySelector('[data-additional-item="6"]')).not.toBeNull();
    const editor = page.getByRole('textbox', {
      name: messages[locale]['tuple.position'].replace('{position}', '7'),
      exact: true,
    });
    await editor.fill('Edited package 06');
    const expected = structuredClone(data);
    expected.manifest[6] = 'Edited package 06';
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    await page.getByRole('button', { name: messages[locale]['tuple.add'], exact: true }).click();
    await vi.waitFor(() =>
      expect(tail().querySelector('[data-additional-item="13"]')).not.toBeNull(),
    );
    expect(tail().querySelectorAll('[data-additional-item]')).toHaveLength(3);
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section2.label'],
        exact: true,
      })
      .click();
    await vi.waitFor(() =>
      expect(tail().querySelectorAll('[data-additional-item]')).toHaveLength(2),
    );
    expect(tail().querySelector('[data-collection-footer]')).toBeNull();
    expect(onchange.mock.lastCall?.[0].data.allPackages).toEqual(data.allPackages);
  },
);
