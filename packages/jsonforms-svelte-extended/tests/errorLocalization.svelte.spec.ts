import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import { createTranslator } from '@jsonforms/core';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import ErrorControl from './fixtures/ErrorControl.svelte';

it('refreshes mounted errors on locale change with unchanged data', async () => {
  const view = await render(JsonForms, {
    props: {
      data: { name: 'x' },
      schema: { type: 'object', properties: { name: { type: 'string', minLength: 5 } } },
      uischema: { type: 'Control', scope: '#/properties/name' },
      renderers: [{ tester: () => 1, renderer: ErrorControl }],
      i18n: { locale: 'en' },
    },
  });
  await expect.element(page.getByTestId('translated-error')).toMatchTextContent('characters');
  await view.rerender({ i18n: { locale: 'bg' } });
  await expect.element(page.getByTestId('translated-error')).not.toMatchTextContent('characters');
  await expect.element(page.getByTestId('translated-error')).toMatchTextContent('5');
  await view.rerender({
    i18n: {
      locale: 'en',
      translate: createTranslator((_key, fallback) => fallback),
      translateError: () => 'Host error presentation',
    },
  });
  await expect
    .element(page.getByTestId('translated-error'))
    .toMatchTextContent('Host error presentation');
});
