import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { skeletonRenderers } from '../../src/lib/renderers';
import { createSpecGroupLayoutExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-group-layout';
import { cleanup, render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, it } from 'vite-plus/test';

afterEach(cleanup);
it('preserves nested disclosure and field data through keyboard toggles and locale changes', async () => {
  let locale = 'en';
  const example = createSpecGroupLayoutExample(() => locale);
  const view = await render(JsonForms, {
    props: {
      schema: example.schema,
      uischema: example.uischema,
      data: example.data,
      config: example.config,
      i18n: example.i18n,
      renderers: skeletonRenderers,
    },
  });
  await page.getByRole('tab', { name: 'Contact group', exact: true }).click();
  const outer = page.getByRole('button', { name: 'Contact', exact: true });
  const inner = page.getByRole('button', { name: 'Additional details', exact: true });
  await expect.element(outer).toHaveAttribute('aria-expanded', 'true');
  await expect.element(inner).toHaveAttribute('aria-expanded', 'false');
  await outer.click();
  await expect.element(outer).toHaveAttribute('aria-expanded', 'false');
  await userEvent.keyboard('{Enter}');
  await expect.element(outer).toHaveAttribute('aria-expanded', 'true');
  await expect.element(inner).toHaveAttribute('aria-expanded', 'false');
  await inner.click();
  await expect
    .element(page.getByRole('textbox', { name: 'Alternate phone', exact: true }))
    .toHaveValue('+1 503 555 0113');
  locale = 'bg';
  await view.rerender({ i18n: example.i18n });
  await expect
    .element(page.getByRole('button', { name: 'Допълнителни данни', exact: true }))
    .toHaveAttribute('aria-expanded', 'true');
  await expect
    .element(page.getByRole('textbox', { name: 'Допълнителен телефон', exact: true }))
    .toHaveValue('+1 503 555 0113');
  expect(view.container.querySelector('[data-group-indicator]')?.getAttribute('title')).toBe(
    'Съдържа данни',
  );
});
