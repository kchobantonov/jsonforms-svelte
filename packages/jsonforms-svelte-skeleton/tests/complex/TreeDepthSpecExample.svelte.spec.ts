import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { createAjv, type JsonSchema, type UISchemaElement } from '@jsonforms/core';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { skeletonRenderers } from '../../src/lib/renderers';
import { createSpecTreeMaxDepthExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-tree-max-depth';
import { uischemas } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-tree-max-depth/uischemas';
import original from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-tree-max-depth/data.json';
afterEach(cleanup);
it.each(['en', 'bg'])('honors the canonical five-level limit in %s', async (locale) => {
  const example = createSpecTreeMaxDepthExample(() => locale);
  const onchange = vi.fn();
  const onvaliditychange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: example.schema as JsonSchema,
      uischema: example.uischema as UISchemaElement,
      data: structuredClone(original),
      i18n: example.i18n,
      uischemas,
      renderers: skeletonRenderers,
      ajv: createAjv({ useDefaults: true }),
      onchange,
      onvaliditychange,
    },
  });
  await vi.waitFor(() =>
    expect(
      [...view.container.querySelectorAll<HTMLInputElement>('input')].map((input) => input.value),
    ).toContain('Level 5'),
  );
  const addName = locale === 'bg' ? 'Бутон за добавяне към Деца' : 'Add to Children button';
  const buttons = [
    ...view.container.querySelectorAll<HTMLButtonElement>(`button[aria-label="${addName}"]`),
  ];
  expect(buttons).toHaveLength(5);
  expect(buttons.slice(0, 4).every((button) => !button.disabled)).toBe(true);
  expect(buttons[4].disabled).toBe(true);
  expect(onchange.mock.lastCall?.[0].data).toEqual(original);
  expect(onchange.mock.lastCall?.[0].errors).toHaveLength(0);
  expect(view.container.textContent).not.toContain('No applicable renderer');
  const deepest = [...view.container.querySelectorAll<HTMLInputElement>('input')].find(
    (input) => input.value === 'Level 5',
  )!;
  deepest.value = 'Edited level 5';
  deepest.dispatchEvent(new Event('input', { bubbles: true }));
  const expected = structuredClone(original);
  expected.tree.children[0].children[0].children[0].children[0].name = 'Edited level 5';
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
  const serverError = {
    instancePath: '/tree/children/0/children/0/children/0/children/0/name',
    schemaPath: '',
    keyword: 'server',
    params: {},
    message: 'server-depth',
  };
  await view.rerender({ additionalErrors: [serverError] });
  await vi.waitFor(() =>
    expect(onvaliditychange.mock.lastCall?.[0].additionalErrors).toEqual([serverError]),
  );
  expect(view.container.textContent).toContain('server-depth');
  await view.rerender({ additionalErrors: [], data: expected, readonly: true });
  await vi.waitFor(() => expect(onvaliditychange.mock.lastCall?.[0].valid).toBe(true));
  expect(
    [
      ...view.container.querySelectorAll<HTMLButtonElement>(`button[aria-label="${addName}"]`),
    ].every((button) => button.disabled),
  ).toBe(true);
  expect(onchange.mock.lastCall?.[0].data).toEqual(expected);
});
