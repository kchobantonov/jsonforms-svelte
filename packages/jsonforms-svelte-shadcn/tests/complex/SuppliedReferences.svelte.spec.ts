import { createRendererAjv } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema } from '@jsonforms/core';
import { cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { shadcnRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';

afterEach(cleanup);

const common = {
  $id: 'https://example.test/common.json',
  definitions: {
    Name: { type: 'string', minLength: 2 },
    Profile: { type: 'object', properties: { name: { $ref: '#/definitions/Name' } } },
  },
};
const schema = (target: string) =>
  ({
    $id: 'https://example.test/root.json',
    type: 'object',
    properties: { value: { $ref: `https://example.test/common.json#/definitions/${target}` } },
  }) as JsonSchema;
const suppliedAjv = () => {
  const ajv = createRendererAjv();
  ajv.addSchema(common);
  return ajv;
};

it('edits and validates a supplied scalar while retaining external Ajv error paths', async () => {
  const data = { value: 'Alpha' };
  const { view, onchange } = await mountForm({
    schema: schema('Name'),
    data,
    ajv: suppliedAjv(),
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: shadcnRenderers,
  });
  expect(view.container.querySelector('input')?.value).toBe('Alpha');
  await page.getByRole('textbox').fill('Beta');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual({ value: 'Beta' }));
  await page.getByRole('textbox').fill('A');
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].errors[0]?.schemaPath).toBe(
      'https://example.test/common.json#/definitions/Name/minLength',
    ),
  );
  await view.rerender({ data: { value: 'Host' } });
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual({ value: 'Host' }));
});

it('resolves local references inside a supplied object document', async () => {
  const data = { value: { name: 'Ada' } };
  const { view, onchange } = await mountForm({
    schema: schema('Profile'),
    data,
    ajv: suppliedAjv(),
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: shadcnRenderers,
  });
  expect(view.container.querySelector('input')?.value).toBe('Ada');
  await page.getByRole('textbox').fill('Grace');
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data).toEqual({ value: { name: 'Grace' } }),
  );
});

it('edits an absolute external reference from an anonymous root schema', async () => {
  const { view, onchange } = await mountForm({
    schema: {
      type: 'object',
      properties: { value: { $ref: 'https://example.test/common.json#/definitions/Name' } },
    } as JsonSchema,
    data: { value: 'Ada' },
    ajv: suppliedAjv(),
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: shadcnRenderers,
  });
  expect(view.container.querySelector('input')?.value).toBe('Ada');
  await page.getByRole('textbox').fill('Grace');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual({ value: 'Grace' }));
});

it('edits a nested resource registered through its parent document', async () => {
  const ajv = createRendererAjv();
  ajv.addSchema({
    $id: 'https://example.test/common.json',
    $defs: { Nested: { $id: 'nested.json', type: 'string', minLength: 2 } },
  });
  const { view, onchange } = await mountForm({
    schema: {
      $id: 'https://example.test/root.json',
      properties: { value: { $ref: 'https://example.test/nested.json' } },
    } as JsonSchema,
    data: { value: 'Ada' },
    ajv,
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: shadcnRenderers,
  });
  expect(view.container.querySelector('input')?.value).toBe('Ada');
  await page.getByRole('textbox').fill('Grace');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual({ value: 'Grace' }));
});

it('recovers when the host supplies the missing resource through a new Ajv', async () => {
  const data = { value: 'Kept' };
  const { view, onchange } = await mountForm({
    schema: schema('Name'),
    data,
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: shadcnRenderers,
  });
  expect(view.container.querySelector('[data-schema-reference-error]')).not.toBeNull();
  await view.rerender({ validationMode: 'NoValidation' });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-schema-reference-error]')).not.toBeNull(),
  );
  await view.rerender({ ajv: suppliedAjv() });
  await vi.waitFor(() =>
    expect(view.container.querySelector('[data-schema-reference-error]')).toBeNull(),
  );
  expect(onchange.mock.lastCall?.[0].data).toEqual(data);
  await page.getByRole('textbox').fill('Ready');
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual({ value: 'Ready' }));
});

it.each([true, false])(
  'diagnoses a missing external document in NoValidation and recovers, identified root: %s',
  async (identified) => {
    const data = { value: 'Kept' };
    const { view, onchange } = await mountForm({
      schema: identified
        ? schema('Name')
        : ({ properties: schema('Name').properties } as JsonSchema),
      data,
      uischema: { type: 'Control', scope: '#/properties/value' },
      renderers: shadcnRenderers,
      validationMode: 'NoValidation',
    });
    expect(view.container.querySelector('[data-schema-reference-error]')?.textContent).toContain(
      'https://example.test/common.json#/definitions/Name',
    );
    expect(view.container.querySelector('input')).toBeNull();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data));
    const validity = vi.fn();
    await view.rerender({ onvaliditychange: validity });
    await vi.waitFor(() => expect(validity.mock.lastCall?.[0].valid).toBe(false));
    expect(validity.mock.lastCall?.[0].current).toBe(false);
    await view.rerender({ ajv: suppliedAjv() });
    await vi.waitFor(() =>
      expect(view.container.querySelector('[data-schema-reference-error]')).toBeNull(),
    );
    expect(onchange.mock.lastCall?.[0].data).toEqual(data);
    await page.getByRole('textbox').fill('Ready');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual({ value: 'Ready' }));
  },
);

it('diagnoses an unknown anchor in a registered document under NoValidation', async () => {
  const data = { value: 'Kept' };
  const { view, onchange } = await mountForm({
    schema: {
      $id: 'https://example.test/root.json',
      properties: { value: { $ref: 'https://example.test/common.json#missing' } },
    } as JsonSchema,
    data,
    ajv: suppliedAjv(),
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: shadcnRenderers,
    validationMode: 'NoValidation',
  });
  expect(view.container.querySelector('[data-schema-reference-error]')?.textContent).toContain(
    'https://example.test/common.json#missing',
  );
  expect(view.container.querySelector('input')).toBeNull();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data));
});

it('diagnoses a missing pointer in a registered document under NoValidation', async () => {
  const data = { value: 'Kept' };
  const { view, onchange } = await mountForm({
    schema: schema('Missing'),
    data,
    ajv: suppliedAjv(),
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: shadcnRenderers,
    validationMode: 'NoValidation',
  });
  expect(view.container.querySelector('[data-schema-reference-error]')?.textContent).toContain(
    'https://example.test/common.json#/definitions/Missing',
  );
  expect(view.container.querySelector('input')).toBeNull();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data));
});

it('diagnoses a relative external ref from an anonymous root without guessing a base', async () => {
  const data = { value: 'Kept' };
  const { view, onchange } = await mountForm({
    schema: { properties: { value: { $ref: 'relative.json' } } } as JsonSchema,
    data,
    uischema: { type: 'Control', scope: '#/properties/value' },
    renderers: shadcnRenderers,
    validationMode: 'NoValidation',
  });
  expect(view.container.querySelector('[data-schema-reference-error]')?.textContent).toContain(
    'relative.json',
  );
  expect(view.container.querySelector('input')).toBeNull();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(data));
});
