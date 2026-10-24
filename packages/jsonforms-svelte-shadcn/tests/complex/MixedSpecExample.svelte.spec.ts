import { afterEach, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup } from 'vitest-browser-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { shadcnRenderers } from '../../src/lib/renderers';
import { createSpecMixedControlExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control';
import { mountForm } from '../testUtils';
import '../test.css';

afterEach(cleanup);
it.each(['en', 'bg'])(
  'renders the canonical mixed composition examples in %s without modifying their data',
  async (locale) => {
    const example = createSpecMixedControlExample(() => locale);
    const { view, onchange } = await mountForm({
      schema: example.schema as JsonSchema,
      uischema: example.uischema as UISchemaElement,
      data: example.data,
      config: example.config as Record<string, unknown>,
      i18n: example.i18n,
      renderers: shadcnRenderers,
    });
    await page
      .getByRole('tab', {
        name: example.i18n!.translate!('mixedComposition.navigation.label', ''),
        exact: true,
      })
      .click();
    await expect
      .poll(() =>
        [...view.container.querySelectorAll<HTMLInputElement>('input')].map((input) => input.value),
      )
      .toEqual(expect.arrayContaining(['Hello', 'Ada', 'abcd']));
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    expect(
      onchange.mock.lastCall?.[0].errors.some(
        (error: { keyword: string; instancePath: string }) =>
          error.keyword === 'oneOf' && error.instancePath === '/overlappingChoice',
      ),
    ).toBe(true);
  },
);
