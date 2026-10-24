import { createAjv, RuleEffect } from '@jsonforms/core';
import { expect, it } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import RuleControl from './fixtures/RuleControl.svelte';

it.each([RuleEffect.SHOW, RuleEffect.DISABLE, RuleEffect.READONLY])(
  'isolates %s schema rules during mounted control mapping',
  async (effect) => {
    const ajv = createAjv({ useDefaults: true });
    const props = {
      ajv,
      schema: { type: 'object', properties: { text: { type: 'string' } } },
      data: { text: 'original' },
      uischema: {
        type: 'Control',
        scope: '#/properties/text',
        rule: {
          effect,
          condition: {
            scope: '#',
            schema: {
              type: 'object',
              properties: { injected: { type: 'number', default: 9 } },
              required: ['injected'],
            },
          },
        },
      },
      renderers: [{ tester: () => 1, renderer: RuleControl }],
    };
    const view = await render(JsonForms, { props });
    await expect.element(page.getByTestId('rule-data')).toMatchTextContent('{"text":"original"}');
    await expect.element(page.getByTestId('rule-visible')).toMatchTextContent('true');
    if (effect === RuleEffect.DISABLE)
      await expect.element(page.getByTestId('rule-enabled')).toMatchTextContent('false');
    if (effect === RuleEffect.READONLY)
      await expect.element(page.getByTestId('rule-readonly')).toMatchTextContent('true');
    await view.rerender({ data: { text: 'updated' } });
    await expect.element(page.getByTestId('rule-data')).toMatchTextContent('{"text":"updated"}');
  },
);
