import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { render, cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import { createSpecPreTouchErrorsExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-pre-touch-errors';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-pre-touch-errors/translations.json';
import supplement from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-pre-touch-errors/translations.supplement.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'filters complete eligible errors until blur in %s',
  async (locale) => {
    const example = createSpecPreTouchErrorsExample(() => locale);
    const onchange = vi.fn();
    const hostMessage =
      locale === 'bg' ? 'Името не е одобрено от сървъра.' : 'The server did not approve this name.';
    const view = render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(example.data),
        config: { ...example.config, enableFilterErrorsBeforeTouch: true },
        i18n: example.i18n,
        additionalErrors: [
          {
            instancePath: '/legalName',
            schemaPath: '#/server',
            keyword: 'server',
            params: {},
            message: hostMessage,
          },
        ],
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
      },
    });
    const legalName = page.getByRole('textbox', {
      name: supplement[locale]['legalName.label'],
      exact: false,
    });
    const activePanel = page.getByRole('tabpanel');
    const required = translations[locale]['error.required'];
    await expect.element(page.getByText(hostMessage, { exact: true })).toBeVisible();
    expect(activePanel.getByText(required, { exact: true }).query()).toBeNull();
    await legalName.click();
    expect(activePanel.getByText(required, { exact: true }).query()).toBeNull();
    await userEvent.tab();
    await expect.element(activePanel.getByText(required, { exact: false })).toBeVisible();
    expect(view.container.textContent).toContain(hostMessage);
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyword: 'required', params: { missingProperty: 'legalName' } }),
      ]),
    );
    await view.rerender({ validationMode: 'ValidateAndHide' });
    await expect.element(page.getByText(hostMessage, { exact: true })).toBeVisible();
    expect(activePanel.getByText(required, { exact: false }).query()).toBeNull();
  },
);
