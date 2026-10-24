import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import type { UISchemaElement } from '@jsonforms/core';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'keeps scoped counts and host errors visible in %s while collapsed',
  async (locale) => {
    const uischema = {
      type: 'Group',
      label: 'Section',
      options: { collapsible: true, collapsed: true },
      elements: [
        { type: 'Control', scope: '#/properties/name' },
        { type: 'Control', scope: '#/properties/name' },
      ],
    } as UISchemaElement;
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'object', properties: { name: { type: 'string', minLength: 2 } } },
        uischema,
        data: { name: '' },
        i18n: { locale },
        config: {
          jsonformsExtended: { showValidationIndicator: true, showValidationIndicatorCount: true },
        },
        renderers: shadcnRenderers,
        cells: shadcnCells,
      },
    });
    const one = messages[locale]['validation.containerError'].replace('{count}', '1');
    const two = messages[locale]['validation.containerErrors'].replace('{count}', '2');
    await expect.element(page.getByRole('img', { name: one, exact: true })).toBeVisible();
    const marker = page.getByRole('img', { name: one, exact: true });
    await marker.click();
    await expect.element(page.getByRole('tooltip')).toMatchTextContent(one);
    expect(
      view.container.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded'),
    ).toBe('false');
    await userEvent.keyboard('{Escape}');
    await expect.element(page.getByRole('tooltip')).not.toBeInTheDocument();

    await view.rerender({
      additionalErrors: [
        {
          instancePath: '/name',
          schemaPath: '#/host',
          keyword: 'host',
          params: {},
          message: 'Host error',
        },
      ],
    });
    await expect.element(page.getByRole('img', { name: two, exact: true })).toBeVisible();
    await view.rerender({ validationMode: 'ValidateAndHide' });
    await expect.element(page.getByRole('img', { name: one, exact: true })).toBeVisible();
    await view.rerender({
      uischema: { ...uischema, options: { ...uischema.options, showValidationIndicator: false } },
    });
    expect(page.getByRole('img', { name: one, exact: true }).query()).toBeNull();
  },
);
