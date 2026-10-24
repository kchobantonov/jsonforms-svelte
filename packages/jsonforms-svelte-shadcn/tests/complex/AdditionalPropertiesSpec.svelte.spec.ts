import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { shadcnCells, shadcnRenderers } from '../../src/lib';
import { cleanup, render } from 'vitest-browser-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { createSpecAdditionalPropertiesExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-additional-properties';
import translations from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-additional-properties/translations.json';

afterEach(cleanup);
it.each(['en', 'bg'] as const)(
  'edits canonical literal keys without changing their neighbors in %s',
  async (locale) => {
    const example = createSpecAdditionalPropertiesExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(example.data),
        config: example.config,
        i18n: example.i18n,
        renderers: shadcnRenderers,
        cells: shadcnCells,
        onchange,
      },
    });
    const tab = (key: keyof typeof translations.en) =>
      (
        page
          .getByRole('tab', { name: translations[locale][key], exact: true })
          .element() as HTMLElement
      ).click();
    tab('featureNavigation.section2.label');
    const dotted = page.getByRole('textbox', { name: 'legacy.key', exact: true });
    await expect.element(dotted).toHaveValue('written by the old project system');
    await dotted.fill('Edited literal key');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.annotations['legacy.key']).toBe('Edited literal key'),
    );
    expect(onchange.mock.lastCall![0].data.annotations.legacy).toBeUndefined();
    expect(onchange.mock.lastCall![0].data.annotations['notes/1']).toBe(
      'a slash is an ordinary character in a key',
    );
    tab('featureNavigation.section1.label');
    let empty: HTMLInputElement | undefined;
    await vi.waitFor(() => {
      empty = [...view.container.querySelectorAll('input')].find(
        (input) => input.value === 'unnamed label',
      );
      expect(empty).toBeDefined();
    });
    await page.elementLocator(empty!).fill('Edited empty key');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.labels['']).toBe('Edited empty key'),
    );
    expect(onchange.mock.lastCall![0].data.labels['items[0]']).toBe('crate');
    expect(onchange.mock.lastCall![0].data.labels['  spaced  ']).toBe('kept exactly');
    expect(onchange.mock.lastCall![0].data.labels['2024']).toBe('season');
  },
);
