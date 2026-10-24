import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { ControlElement, UISchemaElement } from '@jsonforms/core';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { skeletonRenderers, skeletonCells } from '../../src/lib';
import { createSpecDestructiveConfirmationExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-destructive-confirmation/translations.json';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'applies the canonical property/table policy and local never override in %s',
  async (locale) => {
    const example = createSpecDestructiveConfirmationExample(() => locale);
    const onchange = vi.fn();
    await render(JsonForms, {
      props: {
        schema: example.schema!,
        uischema: example.uischema!,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    const expected = structuredClone(example.data) as {
      notes: Record<string, unknown>;
      lines: unknown[];
      quietLines: unknown[];
    };
    const panel = page.getByRole('tabpanel', {
      name: translations[locale]['featureNavigation.section1.label'],
      exact: true,
    });
    const propertyDelete = page
      .getByRole('button', {
        name: messages[locale]['additionalProperties.removeAriaLabel'],
        exact: true,
      })
      .first();
    await propertyDelete.click();
    const dialog = page.getByRole('dialog', {
      name: translations[locale]['confirm.delete.title'],
      exact: true,
    });
    await expect.element(dialog).toBeVisible();
    expect(onchange.mock.lastCall?.[0].data).toEqual(expected);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await vi.waitFor(() => expect(dialog.query()).toBeNull());
    expect(onchange.mock.lastCall?.[0].data).toEqual(expected);
    await propertyDelete.click();
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    delete expected.notes.gate;
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    await vi.waitFor(() => expect(dialog.query()).toBeNull());
    const rowDelete = panel
      .getByRole('table')
      .nth(0)
      .getByRole('button', { name: messages[locale]['array.removeAriaLabel'], exact: true });
    await rowDelete.click();
    await expect.element(dialog).toBeVisible();
    expect(onchange.mock.lastCall?.[0].data).toEqual(expected);
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    expected.lines = [];
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    await vi.waitFor(() => expect(dialog.query()).toBeNull());
    await panel
      .getByRole('table')
      .nth(1)
      .getByRole('button', { name: messages[locale]['array.removeAriaLabel'], exact: true })
      .click();
    expected.quietLines = [];
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    expect(dialog.query()).toBeNull();
  },
);

it.each(['en', 'bg'] as const)(
  'uses the same policy for expandable and list details in %s',
  async (locale) => {
    for (const [field, type] of [
      ['milestones', 'Control'],
      ['coordinators', 'ListWithDetail'],
    ] as const) {
      const example = createSpecDestructiveConfirmationExample(() => locale);
      const onchange = vi.fn();
      const view = await render(JsonForms, {
        props: {
          schema: example.schema!,
          uischema: { type, scope: `#/properties/${field}` } as UISchemaElement,
          data: structuredClone(example.data),
          config: example.config,
          i18n: example.i18n,
          renderers: skeletonRenderers,
          cells: skeletonCells,
          onchange,
        },
      });
      const remove = page
        .getByRole('button', { name: messages[locale]['array.removeAriaLabel'], exact: true })
        .first();
      await remove.click();
      const dialog = page.getByRole('dialog', {
        name: translations[locale]['confirm.delete.title'],
        exact: true,
      });
      await expect.element(dialog).toBeVisible();
      expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
      await dialog
        .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
        .click();
      await vi.waitFor(() => expect(dialog.query()).toBeNull());
      await remove.click();
      await dialog
        .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
        .click();
      const expected = structuredClone(example.data) as Record<string, unknown[]>;
      expected[field] = expected[field].slice(1);
      await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
      await vi.waitFor(() => expect(dialog.query()).toBeNull());
      await view.unmount();
    }
  },
);

it('does not delete a replaced target or a target that became readonly while confirmation was open', async () => {
  const example = createSpecDestructiveConfirmationExample(() => 'en');
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: example.schema!,
      uischema: { type: 'Control', scope: '#/properties/lines' } as ControlElement,
      data: structuredClone(example.data),
      config: example.config,
      i18n: example.i18n,
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const remove = page.getByRole('button', {
    name: messages.en['array.removeAriaLabel'],
    exact: true,
  });
  const dialog = page.getByRole('dialog', {
    name: translations.en['confirm.delete.title'],
    exact: true,
  });
  await remove.click();
  const replacement = {
    ...(example.data as object),
    lines: [{ code: 'Replacement', quantity: 8 }],
  };
  await view.rerender({ data: replacement });
  await vi.waitFor(() => expect(dialog.query()).toBeNull());
  expect(onchange.mock.lastCall?.[0].data).toEqual(replacement);
  await remove.click();
  await view.rerender({ readonly: true });
  await vi.waitFor(() => expect(dialog.query()).toBeNull());
  expect(onchange.mock.lastCall?.[0].data).toEqual(replacement);
});

it.each(['en', 'bg'] as const)(
  'confirms nonempty composite deletion but clears empty containers directly in %s',
  async (locale) => {
    const example = createSpecDestructiveConfirmationExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema!,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        onchange,
        renderers: skeletonRenderers,
        cells: skeletonCells,
        uischema: {
          type: 'Control',
          scope: '#/properties/compositeRows',
          options: { table: true },
        },
      },
    });
    await vi.waitFor(() =>
      expect(view.container.querySelectorAll('[data-composite-cell]')).toHaveLength(4),
    );
    const cells = view.container.querySelectorAll('[data-composite-cell]');
    const first = page
      .elementLocator(cells[0])
      .getByRole('button', { name: /^(Remove|Премахване)/ });
    await first.click();
    const dialog = page.getByRole('dialog', {
      name: translations[locale]['confirm.delete.title'],
      exact: true,
    });
    await expect.element(dialog).toBeVisible();
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.decline'], exact: true })
      .click();
    await vi.waitFor(() => expect(dialog.query()).toBeNull());
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    await first.click();
    await dialog
      .getByRole('button', { name: translations[locale]['confirm.accept'], exact: true })
      .click();
    const expected = structuredClone(example.data) as {
      compositeRows: { object?: unknown; array: unknown[] }[];
    };
    delete expected.compositeRows[0].object;
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    await page
      .elementLocator(cells[2])
      .getByRole('button', { name: /^(Remove|Премахване)/ })
      .click();
    delete expected.compositeRows[1].object;
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    expect(dialog.query()).toBeNull();
  },
);

it('confirms additional tuple item deletion and preserves the fixed prefix', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: [{ type: 'string' }],
        additionalItems: { type: 'object', properties: { note: { type: 'string' } } },
      },
      uischema: { type: 'Control', scope: '#' },
      data: ['fixed', { note: 'keep until confirmed' }],
      onchange,
      renderers: skeletonRenderers,
      cells: skeletonCells,
    },
  });
  await page
    .getByRole('button', {
      name: messages.en['tuple.delete'].replace(
        '{label}',
        messages.en['tuple.position'].replace('{position}', '2'),
      ),
      exact: true,
    })
    .click();
  const dialog = page.getByRole('dialog', {
    name: messages.en['confirm.delete.title'],
    exact: true,
  });
  await expect.element(dialog).toBeVisible();
  expect(onchange.mock.lastCall?.[0].data).toEqual(['fixed', { note: 'keep until confirmed' }]);
  await dialog.getByRole('button', { name: messages.en['confirm.accept'], exact: true }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(['fixed']));
});
