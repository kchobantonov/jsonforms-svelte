import { RuleEffect } from '@jsonforms/core';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import JsonForms from '../src/lib/components/JsonForms.svelte';
import ReadonlyControl from './fixtures/ReadonlyControl.svelte';
it('guards custom control dispatch for READONLY and allows WRITABLE', async () => {
  const makeUi = (effect: RuleEffect) => ({ type: 'Control', scope: '#/properties/text', rule: { effect, condition: { scope: '#', schema: {} } } });
  const props = { schema: { type: 'object', properties: { text: { type: 'string' } } }, data: { text: 'original' }, uischema: makeUi(RuleEffect.READONLY), renderers: [{ tester: () => 1, renderer: ReadonlyControl }] };
  const view = render(JsonForms, { props });
  await page.getByRole('button', { name: 'Write through dispatch' }).click();
  await expect.element(page.getByTestId('control-value')).toHaveTextContent('original');
  await view.rerender({ ...props, uischema: makeUi(RuleEffect.WRITABLE) });
  await page.getByRole('button', { name: 'Write through dispatch' }).click();
  await expect.element(page.getByTestId('control-value')).toHaveTextContent('changed');
});
