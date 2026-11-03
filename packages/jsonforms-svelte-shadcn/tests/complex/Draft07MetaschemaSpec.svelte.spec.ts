import '../test.css';
import type { JsonSchema7 } from '@jsonforms/core';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import { createSpecDraft07MetaschemaExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-draft-07-metaschema';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
afterEach(cleanup);
it.each(['allOf', 'anyOf', 'oneOf'] as const)(
  'uses detail forms for Draft-07 %s arrays by default',
  async (property) => {
    const example = createSpecDraft07MetaschemaExample(() => 'en');
    const view = await render(JsonForms, {
      props: {
        schema: example.schema!,
        data: { [property]: [] },
        uischema: { type: 'Control', scope: `#/properties/${property}` },
        renderers: shadcnRenderers,
        cells: shadcnCells,
      },
    });
    expect(view.container.querySelector('table')).toBeNull();
    expect(view.container.textContent).not.toContain('No applicable renderer');
  },
);
it('opens a composed array value in an explicitly requested table', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              anyOf: [
                { type: 'string', enum: ['string', 'number'] },
                { type: 'array', items: { type: 'string' } },
              ],
            },
          },
        },
      },
      data: [{}],
      uischema: { type: 'Control', scope: '#', options: { table: true } },
      renderers: shadcnRenderers,
      cells: shadcnCells,
    },
  });
  expect(view.container.querySelector('table')).not.toBeNull();
  expect(view.container.querySelector('button[aria-label^="Edit"]')).not.toBeNull();
  expect(view.container.textContent).not.toContain('No applicable renderer');
});
it('adds a nested property schema through the official metaschema', async () => {
  const example = createSpecDraft07MetaschemaExample(() => 'en');
  const data = structuredClone(example.data) as { properties: Record<string, unknown> };
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: example.schema!,
      data,
      uischema: { type: 'Control', scope: '#/properties/properties' },
      renderers: shadcnRenderers,
      cells: shadcnCells,
      onchange,
    },
  });
  await page.getByRole('textbox', { name: 'Property Name' }).first().fill('status');
  await page.getByRole('button', { name: 'Add property to properties' }).first().click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data.properties).toEqual({
      ...data.properties,
      status: true,
    }),
  );
  expect(onchange.mock.lastCall?.[0].errors).toEqual([]);
  await page.getByRole('checkbox', { name: 'status', exact: true }).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data.properties).toEqual({
      ...data.properties,
      status: false,
    }),
  );
});
it.each(['en', 'bg'] as const)(
  'edits a schema document through the unmodified draft-07 metaschema in %s',
  async (locale) => {
    const example = createSpecDraft07MetaschemaExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema!,
        data: structuredClone(example.data),
        uischema: example.uischema!,
        config: example.config,
        i18n: example.i18n,
        onchange,
        renderers: shadcnRenderers,
        cells: shadcnCells,
      },
    });
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(example.data));
    expect(view.container.querySelectorAll('*').length).toBeLessThan(5000);
    const title = page.getByRole('textbox', { name: 'Title', exact: true }).first();
    await expect.element(title).toHaveValue('Inventory item');
    await title.fill('Updated inventory schema');
    (title.element() as HTMLInputElement).blur();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toEqual({
        ...(example.data as object),
        title: 'Updated inventory schema',
      }),
    );
    expect((example.schema as JsonSchema7).$id).toBe('http://json-schema.org/draft-07/schema#');
  },
);

it('retains an imported boolean false subschema in the official metaschema form', async () => {
  const example = createSpecDraft07MetaschemaExample(() => 'en');
  const data = structuredClone(example.data) as { properties: Record<string, unknown> };
  data.properties.quantity = false;
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: example.schema!,
      data,
      uischema: example.uischema!,
      config: example.config,
      i18n: example.i18n,
      onchange,
      renderers: shadcnRenderers,
      cells: shadcnCells,
    },
  });
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data));
  expect(onchange.mock.lastCall?.[0].errors).toEqual([]);
  expect(view.container.textContent).not.toContain('No applicable renderer');
  const quantity = page.getByRole('checkbox', { name: 'quantity', exact: true });
  await quantity.click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({
      ...data,
      properties: { ...data.properties, quantity: true },
    }),
  );
  await quantity.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data));
});
