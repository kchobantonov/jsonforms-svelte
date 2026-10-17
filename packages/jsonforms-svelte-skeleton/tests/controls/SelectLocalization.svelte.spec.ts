import type { JsonSchema, Translator } from '@jsonforms/core';
import { afterEach, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { skeletonRenderers } from '../../src/lib/renderers';
import { mountControl } from '../testUtils';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';

afterEach(cleanup);

const cases: { name: string; schema: JsonSchema; value: unknown }[] = [
  { name: 'enum', schema: { type: 'string', enum: ['A', 'B'] }, value: 'A' },
  {
    name: 'constant oneOf',
    schema: { type: 'string', oneOf: [{ const: 'A' }, { const: 'B' }] },
    value: 'A',
  },
  { name: 'mixed type', schema: { type: ['string', 'number'] }, value: 'A' },
  {
    name: 'object oneOf',
    schema: {
      oneOf: [
        {
          type: 'object',
          title: 'Person',
          properties: { name: { type: 'string' } },
          required: ['name'],
        },
        {
          type: 'object',
          title: 'Count',
          properties: { count: { type: 'number' } },
          required: ['count'],
        },
      ],
    },
    value: { name: 'Ada' },
  },
];

it.each(cases)(
  'localizes the native $name trigger and follows host locale replacements',
  async ({ schema, value }) => {
    const { view, onchange } = mountControl({
      renderers: skeletonRenderers,
      propertySchema: schema,
      value,
      i18n: { locale: 'bg' },
    });
    const trigger = (label: string) => view.getByRole('button', { name: label, exact: true });
    await expect.element(trigger(messages.bg['control.selectOption'])).toBeVisible();
    await view.rerender({ i18n: { locale: 'en' } });
    await expect.element(trigger(messages.en['control.selectOption'])).toBeVisible();
    const translate = ((key: string, fallback?: string) =>
      key === 'control.selectOption' ? 'Choisir' : fallback) as Translator;
    await view.rerender({ i18n: { locale: 'fr', translate } });
    await expect.element(trigger('Choisir')).toBeVisible();
    await view.rerender({ readonly: true });
    await expect.element(trigger('Choisir')).toBeDisabled();
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value });
  },
);
