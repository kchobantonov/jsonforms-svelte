import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { skeletonRenderers } from '../../src/lib/renderers';
import { skeletonCells } from '../../src/lib/cells';
import { createSpecArrayDetailModesExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-array-detail-modes';
import { createSpecEditorDetailsExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-editor-details';
import { uischemas as arrays } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-array-detail-modes/uischemas';
import { uischemas as editors } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-editor-details/uischemas';
import arrayData from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-array-detail-modes/data.json';
import editorData from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-editor-details/data.json';
import arrayMessages from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-array-detail-modes/translations.supplement.json';
import editorMessages from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-editor-details/translations.supplement.json';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
afterEach(cleanup);

it.each(['en', 'bg'] as const)('executes canonical array detail modes in %s', async (locale) => {
  const example = createSpecArrayDetailModesExample(() => locale);
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: example.schema as JsonSchema,
      uischema: example.uischema as UISchemaElement,
      data: structuredClone(arrayData),
      i18n: example.i18n,
      uischemas: arrays,
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  await vi.waitFor(() => expect(view.container.querySelectorAll('input')).toHaveLength(10));
  expect(
    [...view.container.querySelectorAll('label')].filter(
      (label) =>
        label.textContent?.trim() === arrayMessages[locale]['detailExample.registeredName.label'],
    ),
  ).toHaveLength(2);
  expect(onchange.mock.lastCall?.[0].data).toEqual(arrayData);
  await page
    .getByRole('textbox', {
      name: arrayMessages[locale]['arrayDetail.inlineNote.label'],
      exact: true,
    })
    .fill('Edited inline note');
  const expected = structuredClone(arrayData);
  expected.inline[0].note = 'Edited inline note';
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
  expect(view.container.textContent).not.toContain('No applicable renderer');
});

it.each(['en', 'bg'] as const)(
  'executes canonical object, mixed and cell details in %s',
  async (locale) => {
    const example = createSpecEditorDetailsExample(() => locale);
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema as JsonSchema,
        uischema: example.uischema as UISchemaElement,
        data: structuredClone(editorData),
        i18n: example.i18n,
        uischemas: editors,
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    const label = editorMessages[locale]['editorDetail.object.label'];
    view.container
      .querySelector<HTMLButtonElement>(`button[aria-label="${label}"][aria-expanded="false"]`)
      ?.click();
    await vi.waitFor(() =>
      expect(
        [...view.container.querySelectorAll<HTMLInputElement>('input')].map((input) => input.value),
      ).toContain('Generated field'),
    );
    await page
      .getByRole('textbox', {
        name: editorMessages[locale]['editorDetail.note.label'],
        exact: true,
      })
      .fill('Edited mixed note');
    const expected = structuredClone(editorData);
    expected.mixed.note = 'Edited mixed note';
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    view.container.querySelector<HTMLButtonElement>('[data-composite-cell] button')!.click();
    const input = page.getByRole('textbox', {
      name: editorMessages[locale]['detailExample.registeredName.label'],
      exact: true,
    });
    await expect.element(input).toBeVisible();
    await input.fill('Grace');
    expect(onchange.mock.lastCall?.[0].data.rows[0].value).toEqual(editorData.rows[0].value);
    await page
      .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
      .click();
    expected.rows[0].value.name = 'Grace';
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
    expect(view.container.textContent).not.toContain('No applicable renderer');
  },
);
