import type { ControlElement, Layout, UISchemaElement } from '@jsonforms/core';
import { createSpecTemporalControlsExample } from '../../../jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import type { JsonSchema7 } from '@jsonforms/core';
import '../test.css';
import { JsonForms, createRendererAjv } from '@chobantonov/jsonforms-svelte';
import { skeletonRenderers, skeletonCells } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import { page } from 'vite-plus/test/browser';
afterEach(cleanup);
it('retains typed dates with live relative-bound validation independently of restrict', async () => {
  const onchange = vi.fn();
  const control = (restrict?: boolean) => ({
    type: 'Control',
    scope: '#/properties/to',
    options: {
      mask: false,
      dateFormat: 'YYYY-MM-DD',
      ...(restrict === undefined ? {} : { restrict }),
    },
  });
  const view = await render(JsonForms, {
    props: {
      ajv: createRendererAjv({ $data: true }),
      schema: {
        type: 'object',
        properties: {
          from: { type: 'string' },
          to: { type: 'string', format: 'date', formatMinimum: { $data: '1/from' } } as JsonSchema7,
        },
      },
      data: { from: '2026-10-10', to: '2026-10-15' },
      uischema: control(),
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const input = page.getByRole('textbox');
  await input.fill('2026-10-09');
  (input.element() as HTMLInputElement).blur();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.to).toBe('2026-10-09'));
  expect(onchange.mock.lastCall?.[0].errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ keyword: 'formatMinimum' })]),
  );
  await input.fill('2026-10-11');
  (input.element() as HTMLInputElement).blur();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.to).toBe('2026-10-11'));
  await view.rerender({ data: { from: '2026-10-20', to: '2026-10-11' } });
  await input.fill('2026-10-19');
  (input.element() as HTMLInputElement).blur();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.to).toBe('2026-10-19'));
  expect(onchange.mock.lastCall?.[0].errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ keyword: 'formatMinimum' })]),
  );
  await view.rerender({ config: { jsonformsExtended: { restrict: false } } });
  await input.fill('2026-10-18');
  (input.element() as HTMLInputElement).blur();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.to).toBe('2026-10-18'));
  await view.rerender({ uischema: control(true) });
  await input.fill('2026-10-17');
  (input.element() as HTMLInputElement).blur();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.to).toBe('2026-10-17'));
  expect(onchange.mock.lastCall?.[0].errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ keyword: 'formatMinimum' })]),
  );
});
it('retains typed time range violations without clamping imported data', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'time', formatExclusiveMaximum: '09:30:00' } as JsonSchema7,
      data: '11:00:00',
      uischema: {
        type: 'Control',
        scope: '#',
        options: { mask: false, timeFormat: 'HH:mm:ss', timeSaveFormat: 'HH:mm:ss' },
      },
      renderers: skeletonRenderers,
      cells: skeletonCells,
      onchange,
    },
  });
  const input = page.getByRole('textbox');
  await expect.element(input).toHaveValue('11:00:00');
  await input.fill('09:30:00');
  (input.element() as HTMLInputElement).blur();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('09:30:00'));
  expect(onchange.mock.lastCall?.[0].errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ keyword: 'formatExclusiveMaximum' })]),
  );
  await input.fill('09:29:59');
  (input.element() as HTMLInputElement).blur();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('09:29:59'));
});

function findControl(ui: UISchemaElement, scope: string): ControlElement | undefined {
  if (ui.type === 'Control' && (ui as ControlElement).scope === scope) return ui as ControlElement;
  for (const child of (ui as Layout).elements ?? []) {
    const found = findControl(child, scope);
    if (found) return found;
  }
}
it.each(['en', 'bg'] as const)(
  'uses canonical time views without changing the save format in %s',
  async (locale) => {
    const example = createSpecTemporalControlsExample(() => locale);
    const control = findControl(
      example.uischema!,
      '#/properties/uiSchemaBased/properties/coarseTime',
    )!;
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: example.schema!,
        data: structuredClone(example.data),
        uischema: control,
        ajv: createRendererAjv({ $data: true }),
        i18n: example.i18n,
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    const trigger = page.getByRole('button', {
      name: messages[locale]['temporal.chooseTime'],
      exact: true,
    });
    await trigger.click();
    const hours = page.getByRole('spinbutton', {
      name: messages[locale]['temporal.hours'],
      exact: true,
    });
    await expect.element(hours).toBeVisible();
    await expect
      .element(
        page.getByRole('spinbutton', { name: messages[locale]['temporal.minutes'], exact: true }),
      )
      .toBeVisible();
    expect(
      page
        .getByRole('spinbutton', { name: messages[locale]['temporal.seconds'], exact: true })
        .query(),
    ).toBeNull();
    await hours.fill('11');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data.uiSchemaBased.coarseTime).toBe('11:30:00'),
    );
    const expected = structuredClone(example.data) as { uiSchemaBased: { coarseTime: string } };
    expected.uiSchemaBased.coarseTime = '11:30:00';
    expect(onchange.mock.lastCall?.[0].data).toEqual(expected);
    await view.rerender({
      uischema: { ...control, options: { ...control.options, views: undefined } },
    });
    await expect
      .element(
        page.getByRole('spinbutton', { name: messages[locale]['temporal.seconds'], exact: true }),
      )
      .toBeVisible();
  },
);

it.each(['en', 'bg'] as const)(
  'stages the canonical month picker with localized native selectors in %s',
  async (locale) => {
    const example = createSpecTemporalControlsExample(() => locale);
    const control = findControl(example.uischema!, '#/properties/uiSchemaBased/properties/month')!;
    const onchange = vi.fn();
    await render(JsonForms, {
      props: {
        schema: example.schema!,
        data: structuredClone(example.data),
        uischema: control,
        ajv: createRendererAjv({ $data: true }),
        i18n: example.i18n,
        renderers: skeletonRenderers,
        cells: skeletonCells,
        onchange,
      },
    });
    const trigger = page.getByRole('button', {
      name: messages[locale]['temporal.chooseDate'],
      exact: true,
    });
    await trigger.click();
    const month = page.getByRole('combobox', {
      name: messages[locale]['temporal.month'],
      exact: true,
    });
    await expect.element(month).toBeVisible();
    await month.selectOptions('3');
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    await page
      .getByRole('button', { name: messages[locale]['temporal.cancel'], exact: true })
      .click();
    expect(onchange.mock.lastCall?.[0].data).toEqual(example.data);
    await vi.waitFor(() => expect(month.query()).toBeNull());
    await trigger.click();
    await month.selectOptions('3');
    await page.getByRole('button', { name: messages[locale]['temporal.ok'], exact: true }).click();
    const expected = structuredClone(example.data) as { uiSchemaBased: { month: string } };
    expected.uiSchemaBased.month = '2027-03';
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toEqual(expected));
  },
);
