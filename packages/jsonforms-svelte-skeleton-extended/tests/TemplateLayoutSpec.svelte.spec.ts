import './test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
import { skeletonRenderers, skeletonCells } from '@chobantonov/jsonforms-svelte-skeleton';
import { skeletonExtendedRenderers } from '../src/lib';
import { createSpecTemplateLayoutExample } from '../../jsonforms-svelte-demo-common/src/lib/examples/nativeSpecExamples/template-layout';
import fields from '@chobantonov/jsonforms-extended-spec/examples/template-layout/translations.json';
import messages from '../../jsonforms-svelte/src/lib/locales/messages.json';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'runs canonical JSX, Ractive and native Svelte templates in %s',
  async (locale) => {
    const example = createSpecTemplateLayoutExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema!,
        uischema: example.uischema!,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers: [...skeletonExtendedRenderers, ...skeletonRenderers],
        cells: skeletonCells,
        onchange,
      },
    });
    const jsxPanel = page.getByRole('tabpanel', { name: 'lang: jsx', exact: true });
    await vi.waitFor(() =>
      expect(jsxPanel.element().querySelector('[data-greeting]')?.textContent).toBe(
        'Hello Northwind Books',
      ),
    );
    await expect
      .element(
        jsxPanel.getByRole('textbox', {
          name: fields[locale]['specTemplateLayout.schema.properties.jsxNote.label'],
          exact: true,
        }),
      )
      .toBeVisible();
    await expect
      .element(jsxPanel.getByRole('list', { name: 'Validation errors' }))
      .toBeInTheDocument();
    await page
      .getByRole('tab', { name: fields[locale]['nestedSlots.tab.label'], exact: true })
      .click();
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-nested-root] header')?.textContent?.trim()).toBe(
        'Hello Northwind Books',
      ),
    );
    await page.getByRole('tab', { name: 'lang: ractive', exact: true }).click();
    const customer = page.getByRole('textbox', {
      name: fields[locale]['specTemplateLayout.schema.properties.customerName.label'],
      exact: true,
    });
    await customer.fill('Updated customer');
    (customer.element() as HTMLInputElement).blur();
    await vi.waitFor(() =>
      expect(
        page
          .getByRole('tabpanel', { name: 'lang: ractive', exact: true })
          .element()
          .querySelector('[data-greeting]')?.textContent,
      ).toBe(fields[locale]['specTemplateLayout.greeting'] + ' Updated customer'),
    );
    const ractiveNote = page.getByRole('textbox', {
      name: fields[locale]['specTemplateLayout.schema.properties.ractiveNote.label'],
      exact: true,
    });
    await ractiveNote.fill('Ractive slot edit');
    (ractiveNote.element() as HTMLInputElement).blur();
    await page
      .getByRole('tab', { name: fields[locale]['specTemplateLayout.native.label'], exact: true })
      .click();
    await vi.waitFor(() =>
      expect(
        page
          .getByRole('tabpanel', {
            name: fields[locale]['specTemplateLayout.native.label'],
            exact: true,
          })
          .element()
          .querySelector('[data-greeting]')?.textContent,
      ).toBe(fields[locale]['specTemplateLayout.greeting'] + ' Updated customer'),
    );
    const nativeNote = page.getByRole('textbox', {
      name: fields[locale]['specTemplateLayout.schema.properties.nativeNote.label'],
      exact: true,
    });
    await nativeNote.fill('Native slot edit');
    (nativeNote.element() as HTMLInputElement).blur();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        ...(example.data as object),
        customerName: 'Updated customer',
        ractiveNote: 'Ractive slot edit',
        nativeNote: 'Native slot edit',
      }),
    );
    await view.rerender({
      config: { jsonformsExtended: { security: { allowScriptEvaluation: false } } },
    });
    await expect.element(nativeNote).toHaveValue('Native slot edit');
    await page.getByRole('tab', { name: 'lang: ractive', exact: true }).click();
    await expect
      .element(
        page
          .getByRole('tabpanel', { name: 'lang: ractive', exact: true })
          .getByText(messages[locale]['template.evaluationDisabled'], { exact: true }),
      )
      .toBeVisible();
  },
);
