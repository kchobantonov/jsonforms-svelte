import './test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
import { shadcnRenderers, shadcnCells } from '@chobantonov/jsonforms-svelte-shadcn';
import { shadcnExtendedRenderers } from '../src/lib';
import { createSpecTemplateLayoutExample } from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-template-layout';
import fields from '../../jsonforms-svelte-demo-common/src/lib/examples/spec-template-layout/translations.supplement.json';
import messages from '../../jsonforms-svelte/src/lib/locales/messages.json';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'runs canonical Ractive and native Svelte templates with explicit unsupported profiles in %s',
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
        renderers: [...shadcnExtendedRenderers, ...shadcnRenderers],
        cells: shadcnCells,
        onchange,
      },
    });
    await expect
      .element(
        page
          .getByText(
            messages[locale]['template.unsupportedLanguage'].replace('{language}', 'jsx'),
            { exact: true },
          )
          .first(),
      )
      .toBeVisible();
    await page.getByRole('tab', { name: 'lang: ractive', exact: true }).click();
    const customer = page.getByRole('textbox', {
      name: fields[locale]['specTemplateLayout.schema.properties.customerName.label'],
      exact: true,
    });
    await customer.fill('Updated customer');
    (customer.element() as HTMLInputElement).blur();
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-greeting]')?.textContent).toBe(
        fields[locale]['specTemplateLayout.greeting'] + ' Updated customer',
      ),
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
      expect(view.container.querySelector('[data-greeting]')?.textContent).toBe(
        fields[locale]['specTemplateLayout.greeting'] + ' Updated customer',
      ),
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
