import '../test.css';
import type { JsonSchema7 } from '@jsonforms/core';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { flowbiteRenderers, flowbiteCells } from '../../src/lib';
import { createSpecDraft07MetaschemaExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-draft-07-metaschema';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
afterEach(cleanup);
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
        renderers: flowbiteRenderers,
        cells: flowbiteCells,
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
