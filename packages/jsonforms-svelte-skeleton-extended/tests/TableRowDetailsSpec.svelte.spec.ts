import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonCells, skeletonRenderers } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedCells, skeletonExtendedRenderers } from '../src/lib';
import { cleanup, render } from 'vitest-browser-svelte';
import './test.css';
import { expect, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { createSpecTableRowDetailsExample } from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-table-row-details';
import translations from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-table-row-details/translations.supplement.json';
import messages from '../../jsonforms-svelte/src/lib/locales/messages.json';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { afterEach, it } from 'vite-plus/test';
afterEach(cleanup);

it.each(['en', 'bg'] as const)(
  'renders canonical whole-row Label summaries and independent details in %s',
  async (locale) => {
    const example = createSpecTableRowDetailsExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        onchange,
        renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
        cells: [...skeletonExtendedCells, ...skeletonCells],
      },
    });
    await expect
      .element(page.getByText('Applicant 01 — applicant1@example.com', { exact: true }).first())
      .toBeVisible();
    await expect
      .element(page.getByText('Boston · 555-01000', { exact: true }).first())
      .toBeVisible();
    await page
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .first()
      .click();
    const notes = page.getByRole('textbox', {
      name: translations[locale]['detailExample.notes.label'],
      exact: true,
    });
    await notes.fill('Updated canonical note');
    await page
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.applicants[0].notes).toBe('Updated canonical note'),
    );
    await page
      .getByRole('tab', {
        name: new RegExp(`^${translations[locale]['rowDetails.side_panel.label']}`),
      })
      .click();
    await page
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .first()
      .click();
    await expect.element(notes).toHaveValue('Updated canonical note');
    view.container.style.width = '700px';
    await page
      .getByRole('tab', {
        name: new RegExp(`^${translations[locale]['rowDetails.ag_grid_side_panel.label']}`),
      })
      .click();
    await page
      .getByRole('tabpanel', {
        name: new RegExp(`^${translations[locale]['rowDetails.ag_grid_side_panel.label']}`),
      })
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .click();
    await expect.element(notes).toHaveValue('Updated canonical note');
  },
);
