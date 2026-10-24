import { afterEach, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import SectionIndicators from './fixtures/SectionIndicators.svelte';

afterEach(cleanup);
it('keeps data and validation indicators on the same literal bracket-key row', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'object',
        properties: {
          'rows[0]': {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string', minLength: 2 } },
            },
          },
          rows: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: { name: { type: 'string', minLength: 2 } },
              },
            },
          },
        },
      },
      data: { 'rows[0]': [{ name: 'X' }], rows: [[{ name: 'Good' }]] },
      uischema: {
        type: 'Group',
        options: {
          contextPath: 'rows[0].0',
          showDataIndicator: true,
          showValidationIndicator: true,
          showValidationIndicatorCount: true,
        },
        elements: [{ type: 'Control', scope: '#/properties/name' }],
      },
      renderers: [{ tester: () => 1, renderer: SectionIndicators }],
    },
  });
  await expect.element(view.getByTestId('count')).toMatchTextContent('1');
  await expect.element(view.getByTestId('data')).toMatchTextContent('true');
  await view.rerender({ data: { 'rows[0]': [{ name: 'Good' }], rows: [[{ name: 'X' }]] } });
  await expect.element(view.getByTestId('count')).toMatchTextContent('0');
  await view.rerender({
    additionalErrors: [
      {
        instancePath: '/rows[0]/0/name',
        keyword: 'server',
        schemaPath: '',
        params: {},
        message: 'Server',
      },
    ],
    validationMode: 'ValidateAndHide',
  });
  await expect.element(view.getByTestId('count')).toMatchTextContent('1');
});
