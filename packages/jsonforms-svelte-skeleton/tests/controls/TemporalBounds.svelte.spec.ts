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
it('steps the bounded date-time picker through noon without changing a rejected later draft', async () => {
  const onchange = vi.fn();
  const localTime = (hour: number) => new Date(2026, 9, 14, hour).toISOString();
  await render(JsonForms, {
    props: {
      ajv: createRendererAjv(),
      schema: {
        type: 'string',
        format: 'date-time',
        formatMinimum: localTime(11),
        formatMaximum: localTime(13),
      } as JsonSchema7,
      data: localTime(11),
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          ampm: true,
          mask: false,
          showActions: true,
          views: ['hours'],
          dateTimeFormat: 'YYYY-MM-DD hh:mm A',
        },
      },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  await page.getByRole('button', { name: messages.en['temporal.chooseDateTime'] }).click();
  const hour = () => document.querySelector<HTMLInputElement>('input.time-input')!;
  await vi.waitFor(() => expect(hour().value).toBe('11'));
  let column = hour().parentElement!;
  while (column.querySelectorAll('button').length < 2) column = column.parentElement!;
  const increase = () => column.querySelectorAll<HTMLButtonElement>('button')[0]!.click();
  increase();
  await vi.waitFor(() => expect(hour().value).toBe('12'));
  increase();
  await vi.waitFor(() => expect(hour().value).toBe('1'));
  const beforeRejected = onchange.mock.calls.length;
  increase();
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(messages.en['dateTime.outOfRange']),
  );
  expect(hour().value).toBe('1');
  expect(onchange.mock.calls).toHaveLength(beforeRejected);
  column.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
  await vi.waitFor(() => expect(hour().value).toBe('12'));
  increase();
  await vi.waitFor(() => expect(hour().value).toBe('1'));
  await vi.waitFor(() =>
    expect(document.body.textContent).not.toContain(messages.en['dateTime.outOfRange']),
  );
  await page.getByRole('button', { name: messages.en['temporal.ok'] }).click();
  await vi.waitFor(() =>
    expect(new Date(onchange.mock.lastCall?.[0].data).toISOString()).toBe(localTime(13)),
  );
  expect(onchange.mock.lastCall?.[0].errors).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ instancePath: '' })]),
  );
});
it.each([
  { initialHour: 11, savedHour: '13' },
  { initialHour: 23, savedHour: '01' },
])(
  'advances 12-hour picker steps across $initialHour using the underlying clock',
  async ({ initialHour, savedHour }) => {
    const onchange = vi.fn();
    const initial = new Date(2026, 9, 14, initialHour);
    await render(JsonForms, {
      props: {
        ajv: createRendererAjv(),
        schema: { type: 'string', format: 'time' } as JsonSchema7,
        data: `${initial.toISOString().slice(11, 19)}Z`,
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            ampm: true,
            mask: false,
            showActions: true,
            views: ['hours'],
            timeFormat: 'hh:mm A',
          },
        },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    await page.getByRole('button', { name: messages.en['temporal.chooseTime'] }).click();
    const hour = () => document.querySelector<HTMLInputElement>('input.time-input')!;
    await vi.waitFor(() => expect(hour().value).toBe('11'));
    let column = hour().parentElement!;
    while (column.querySelectorAll('button').length < 2) column = column.parentElement!;
    const increase = () => column.querySelectorAll<HTMLButtonElement>('button')[0]!.click();
    increase();
    await vi.waitFor(() => expect(hour().value).toBe('12'));
    increase();
    await vi.waitFor(() => expect(hour().value).toBe('1'));
    await page.getByRole('button', { name: messages.en['temporal.ok'] }).click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toMatch(
        new RegExp(`^${savedHour}:00:00(?:Z|[+-]\\d\\d:\\d\\d)$`),
      ),
    );
  },
);
it('preserves the date-time draft after rejecting an out-of-range AM/PM switch', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      ajv: createRendererAjv(),
      schema: {
        type: 'string',
        format: 'date-time',
        formatMinimum: '2026-10-14T09:00:00Z',
        formatMaximum: '2026-10-14T13:00:00Z',
      } as JsonSchema7,
      data: '2026-10-14T11:00:00Z',
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          ampm: true,
          mask: false,
          showActions: true,
          views: ['hours'],
          dateTimeFormat: 'YYYY-MM-DD hh:mm A',
        },
      },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  await page.getByRole('button', { name: messages.en['temporal.chooseDateTime'] }).click();
  const hour = () => document.querySelector<HTMLInputElement>('input.time-input')!;
  await vi.waitFor(() => expect(hour()?.value).toBeTruthy());
  const firstHour = Number(hour().value);
  const beforeRejected = onchange.mock.calls.length;
  Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .find((button) => button.textContent?.trim() === 'PM')!
    .click();
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(messages.en['dateTime.outOfRange']),
  );
  expect(onchange.mock.calls).toHaveLength(beforeRejected);
  let column = hour().parentElement!;
  while (column.querySelectorAll('button').length < 2) column = column.parentElement!;
  column.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
  await vi.waitFor(() => expect(Number(hour().value)).toBe(firstHour === 1 ? 12 : firstHour - 1));
  await page.getByRole('button', { name: messages.en['temporal.ok'] }).click();
  await vi.waitFor(() =>
    expect(new Date(onchange.mock.lastCall?.[0].data).toISOString()).toBe(
      '2026-10-14T10:00:00.000Z',
    ),
  );
  expect(onchange.mock.lastCall?.[0].errors).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ instancePath: '' })]),
  );
});
it('keeps the selected period after rejecting an out-of-range AM/PM switch', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      ajv: createRendererAjv(),
      schema: {
        type: 'string',
        format: 'time',
        formatMinimum: '09:00:00Z',
        formatMaximum: '13:00:00Z',
      } as JsonSchema7,
      data: '11:00:00Z',
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          ampm: true,
          mask: false,
          showActions: true,
          views: ['hours'],
          timeFormat: 'hh:mm A',
        },
      },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  await page.getByRole('button', { name: messages.en['temporal.chooseTime'] }).click();
  const hour = () => document.querySelector<HTMLInputElement>('input.time-input')!;
  await vi.waitFor(() => expect(hour()?.value).toBeTruthy());
  const firstHour = Number(hour().value);
  const beforeRejected = onchange.mock.calls.length;
  Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
    .find((button) => button.textContent?.trim() === 'PM')!
    .click();
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(messages.en['time.outOfRange']),
  );
  expect(onchange.mock.calls).toHaveLength(beforeRejected);
  let column = hour().parentElement!;
  while (column.querySelectorAll('button').length < 2) column = column.parentElement!;
  column.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
  await vi.waitFor(() => expect(Number(hour().value)).toBe(firstHour === 1 ? 12 : firstHour - 1));
  await page.getByRole('button', { name: messages.en['temporal.ok'] }).click();
  await vi.waitFor(() =>
    expect(new Date(`2020-01-01T${onchange.mock.lastCall?.[0].data}`).toISOString()).toBe(
      '2020-01-01T10:00:00.000Z',
    ),
  );
  expect(onchange.mock.lastCall?.[0].errors).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ instancePath: '' })]),
  );
});
it('uses validator ordering when a zone-free time minimum meets an offset maximum', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      ajv: createRendererAjv(),
      schema: {
        type: 'object',
        properties: {
          time: {
            type: 'string',
            format: 'time',
            formatMinimum: '00:00:00',
            formatMaximum: '13:00:00Z',
          } as JsonSchema7,
        },
      },
      data: { time: '11:00:00Z' },
      uischema: {
        type: 'Control',
        scope: '#/properties/time',
        options: { mask: false, showActions: true, views: ['hours'], timeFormat: 'HH:mm' },
      },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  await page.getByRole('button', { name: messages.en['temporal.chooseTime'] }).click();
  const hour = () => document.querySelector<HTMLInputElement>('input.time-input')!;
  await vi.waitFor(() => expect(hour()?.value).toBeTruthy());
  const column = () => {
    let parent = hour().parentElement!;
    while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
    return parent;
  };
  const firstHour = Number(hour().value);
  const click = async (direction: 0 | 1, expected: number) => {
    column().querySelectorAll<HTMLButtonElement>('button')[direction]!.click();
    await vi.waitFor(() => expect(Number(hour().value)).toBe(expected));
  };
  await click(1, (firstHour + 23) % 24);
  await click(0, firstHour);
  await click(0, (firstHour + 1) % 24);
  await click(0, (firstHour + 2) % 24);
  column().querySelectorAll<HTMLButtonElement>('button')[0]!.click();
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(messages.en['time.outOfRange']),
  );
  expect(Number(hour().value)).toBe((firstHour + 2) % 24);
  await click(1, (firstHour + 1) % 24);
  await page.getByRole('button', { name: messages.en['temporal.ok'] }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.time).not.toBe('11:00:00Z'));
  expect(onchange.mock.lastCall?.[0].errors).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ instancePath: '/time' })]),
  );
});
it('applies exclusive-lower and inclusive-upper offset bounds with a custom save format', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      ajv: createRendererAjv({ $data: true }),
      schema: {
        type: 'object',
        properties: {
          time: {
            type: 'string',
            format: 'time',
            formatExclusiveMinimum: '09:00:00Z',
            formatMaximum: '13:00:00Z',
          } as JsonSchema7,
        },
      },
      data: { time: '11:00:00Z' },
      uischema: {
        type: 'Control',
        scope: '#/properties/time',
        options: {
          mask: false,
          showActions: true,
          views: ['hours'],
          timeFormat: 'HH:mm',
          timeSaveFormat: 'HH:mm:ss.SSSZ',
        },
      },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  await page.getByRole('button', { name: messages.en['temporal.chooseTime'] }).click();
  const hour = () => document.querySelector<HTMLInputElement>('input.time-input')!;
  await vi.waitFor(() => expect(hour()?.value).toBeTruthy());
  const column = () => {
    let parent = hour().parentElement!;
    while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
    return parent;
  };
  const step = async (direction: 0 | 1, expectedHour: number) => {
    column().querySelectorAll<HTMLButtonElement>('button')[direction]!.click();
    await vi.waitFor(() => expect(Number(hour().value)).toBe(expectedHour));
  };
  const firstHour = Number(hour().value);
  await step(0, (firstHour + 1) % 24);
  await step(0, (firstHour + 2) % 24);
  column().querySelectorAll<HTMLButtonElement>('button')[0]!.click();
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(messages.en['time.outOfRange']),
  );
  expect(Number(hour().value)).toBe((firstHour + 2) % 24);
  await step(1, (firstHour + 1) % 24);
  await step(1, firstHour);
  await step(1, (firstHour + 23) % 24);
  column().querySelectorAll<HTMLButtonElement>('button')[1]!.click();
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(messages.en['time.outOfRange']),
  );
  expect(Number(hour().value)).toBe((firstHour + 23) % 24);
  await step(0, firstHour);
  await step(0, (firstHour + 1) % 24);
  await page.getByRole('button', { name: messages.en['temporal.ok'] }).click();
  await vi.waitFor(() =>
    expect(onchange.mock.lastCall?.[0].data.time).toMatch(
      /^\d{2}:00:00\.000(?:Z|[+-]\d{2}:\d{2})$/,
    ),
  );
  expect(onchange.mock.lastCall?.[0].errors).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ instancePath: '/time' })]),
  );
});
it('keeps offset time-picker restrictions valid when the local clock wraps midnight', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      ajv: createRendererAjv({ $data: true }),
      schema: {
        type: 'object',
        properties: {
          time: {
            type: 'string',
            format: 'time',
            formatMinimum: '09:00:00Z',
            formatExclusiveMaximum: '13:00:00Z',
          } as JsonSchema7,
        },
      },
      data: { time: '11:00:00Z' },
      uischema: {
        type: 'Control',
        scope: '#/properties/time',
        options: { mask: false, showActions: true, views: ['hours'], timeFormat: 'HH:mm' },
      },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  await page.getByRole('button', { name: messages.en['temporal.chooseTime'] }).click();
  const hour = () => document.querySelector<HTMLInputElement>('input.time-input')!;
  await vi.waitFor(() => expect(hour()?.value).toBeTruthy());
  const column = () => {
    let parent = hour().parentElement!;
    while (parent.querySelectorAll('button').length < 2) parent = parent.parentElement!;
    return parent;
  };
  const firstHour = Number(hour().value);
  column().querySelectorAll<HTMLButtonElement>('button')[0]!.click();
  await vi.waitFor(() => expect(Number(hour().value)).toBe((firstHour + 1) % 24));
  column().querySelectorAll<HTMLButtonElement>('button')[0]!.click();
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(messages.en['time.outOfRange']),
  );
  expect(Number(hour().value)).toBe((firstHour + 1) % 24);
  column().querySelectorAll<HTMLButtonElement>('button')[1]!.click();
  await vi.waitFor(() => expect(Number(hour().value)).toBe(firstHour));
  column().querySelectorAll<HTMLButtonElement>('button')[1]!.click();
  await vi.waitFor(() => expect(Number(hour().value)).toBe((firstHour + 23) % 24));
  // In Honolulu, the next backward step reaches 23:00 local, which serializes
  // to the following UTC day and is beyond the upper bound.
  if (Intl.DateTimeFormat().resolvedOptions().timeZone === 'Pacific/Honolulu') {
    column().querySelectorAll<HTMLButtonElement>('button')[1]!.click();
    await vi.waitFor(() =>
      expect(document.body.textContent).toContain(messages.en['time.outOfRange']),
    );
    expect(Number(hour().value)).toBe(0);
    column().querySelectorAll<HTMLButtonElement>('button')[0]!.click();
    await vi.waitFor(() => expect(Number(hour().value)).toBe(1));
    column().querySelectorAll<HTMLButtonElement>('button')[1]!.click();
    await vi.waitFor(() => expect(Number(hour().value)).toBe(0));
  }
  await page.getByRole('button', { name: messages.en['temporal.ok'] }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.time).not.toBe('11:00:00Z'));
  expect(onchange.mock.lastCall?.[0].errors).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ instancePath: '/time' })]),
  );
});
it('uses the displayed local clock for offset-bearing time values and referenced bounds', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      ajv: createRendererAjv({ $data: true }),
      schema: {
        type: 'object',
        properties: {
          limit: { type: 'string', format: 'time' },
          time: {
            type: 'string',
            format: 'time',
            formatMinimum: { $data: '1/limit' },
          } as JsonSchema7,
        },
      },
      data: { limit: '19:00:00Z', time: '21:00:00Z' },
      uischema: {
        type: 'Control',
        scope: '#/properties/time',
        options: { mask: false, showActions: true, views: ['hours'], timeFormat: 'HH:mm' },
      },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  await page.getByRole('button', { name: messages.en['temporal.chooseTime'] }).click();
  const display = () => view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  const hour = () => document.querySelector<HTMLInputElement>('input.time-input')!;
  await vi.waitFor(() => expect(Number(hour()?.value)).toBe(Number(display().value.slice(0, 2))));
  const firstHour = Number(hour().value);
  let column = hour().parentElement!;
  while (column.querySelectorAll('button').length < 2) column = column.parentElement!;
  column.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
  await vi.waitFor(() => expect(Number(hour().value)).toBe(firstHour - 1));

  await view.rerender({ data: { limit: '22:00:00Z', time: '22:00:00Z' } });
  await vi.waitFor(() => expect(Number(hour()?.value)).toBe(Number(display().value.slice(0, 2))));
  const replacementHour = Number(hour().value);
  column = hour().parentElement!;
  while (column.querySelectorAll('button').length < 2) column = column.parentElement!;
  const beforeRejected = onchange.mock.calls.length;
  column.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
  await new Promise(requestAnimationFrame);
  expect(Number(hour().value)).toBe(replacementHour);
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(messages.en['time.outOfRange']),
  );
  expect(onchange.mock.calls).toHaveLength(beforeRejected);
  expect(onchange.mock.lastCall?.[0].data.time).toBe('22:00:00Z');
  column.querySelectorAll<HTMLButtonElement>('button')[0]!.click();
  await vi.waitFor(() => expect(Number(hour().value)).toBe(replacementHour + 1));
  await page.getByRole('button', { name: messages.en['temporal.ok'] }).click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.time).not.toBe('22:00:00Z'));
  await vi.waitFor(() => expect(Number(display().value.slice(0, 2))).toBe(replacementHour + 1));
  expect(onchange.mock.lastCall?.[0].data.time).toMatch(/^\d{2}:\d{2}:\d{2}(?:Z|[+-]\d{2}:\d{2})$/);
  expect(onchange.mock.lastCall?.[0].errors).not.toEqual(
    expect.arrayContaining([expect.objectContaining({ instancePath: '/time' })]),
  );
});
it('updates time-picker steps when a referenced minimum changes with host data', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      ajv: createRendererAjv({ $data: true }),
      schema: {
        type: 'object',
        properties: {
          limit: { type: 'string', format: 'time' },
          time: {
            type: 'string',
            format: 'time',
            formatMinimum: { $data: '1/limit' },
          } as JsonSchema7,
        },
      },
      data: { limit: '09:00:00', time: '11:00:00' },
      uischema: {
        type: 'Control',
        scope: '#/properties/time',
        options: { mask: false, showActions: true, views: ['hours'] },
      },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  const trigger = page.getByRole('button', { name: messages.en['temporal.chooseTime'] });
  await trigger.click();
  const hour = () => document.querySelector<HTMLInputElement>('input.time-input')!;
  await vi.waitFor(() => expect(hour()?.value).toBe('11'));
  let column = hour().parentElement!;
  while (column.querySelectorAll('button').length < 2) column = column.parentElement!;
  column.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
  await vi.waitFor(() => expect(hour().value).toBe('10'));

  await view.rerender({ data: { limit: '12:00:00', time: '12:00:00' } });
  await vi.waitFor(() => expect(hour()?.value).toBe('12'));
  column = hour().parentElement!;
  while (column.querySelectorAll('button').length < 2) column = column.parentElement!;
  const beforeRejected = onchange.mock.calls.length;
  column.querySelectorAll<HTMLButtonElement>('button')[1]!.click();
  await new Promise(requestAnimationFrame);
  expect(hour().value).toBe('12');
  await vi.waitFor(() =>
    expect(document.body.textContent).toContain(messages.en['time.outOfRange']),
  );
  expect(onchange.mock.calls).toHaveLength(beforeRejected);
  expect(onchange.mock.lastCall?.[0].data.time).toBe('12:00:00');
});
it.each([
  { name: 'absolute root', source: 'from', pointer: '/from' },
  { name: 'literal dotted sibling', source: 'from.date', pointer: '1/from.date' },
])(
  'restricts the calendar with a $name $data bound and updates it with host data',
  async ({ source, pointer }) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        ajv: createRendererAjv({ $data: true }),
        schema: {
          type: 'object',
          properties: {
            [source]: { type: 'string', format: 'date' },
            to: {
              type: 'string',
              format: 'date',
              formatMinimum: { $data: pointer },
            } as JsonSchema7,
          },
        },
        data: { [source]: '2026-10-10', to: '2026-10-15' },
        uischema: { type: 'Control', scope: '#/properties/to', options: { mask: false } },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    await page.getByRole('button', { name: messages.en['temporal.chooseDate'] }).click();
    const day = (value: number) =>
      [...document.querySelectorAll<HTMLButtonElement>('[data-part="table-cell-trigger"]')].find(
        (button) => button.textContent?.trim() === String(value),
      )!;
    await vi.waitFor(() => expect(day(9)).toBeTruthy());
    const before = onchange.mock.calls.length;
    day(9).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(before);
    await view.rerender({ data: { [source]: '2026-10-12', to: '2026-10-15' } });
    await vi.waitFor(() => expect(day(11)).toBeTruthy());
    const afterHostReplacement = onchange.mock.calls.length;
    day(11).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(afterHostReplacement);
    day(12).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.to).toBe('2026-10-12'));
  },
);
it.each(['1/from', '/from'])(
  'resolves a %s date bound when the edited property has a literal dotted key',
  async (pointer) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        ajv: createRendererAjv({ $data: true }),
        schema: {
          type: 'object',
          properties: { from: { type: 'string', format: 'date' } },
          additionalProperties: {
            type: 'string',
            format: 'date',
            formatMinimum: { $data: pointer },
          } as JsonSchema7,
        },
        data: { from: '2026-10-10', 'to.date': '2026-10-15' },
        uischema: { type: 'Control', scope: '#' },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    await page.getByRole('button', { name: messages.en['temporal.chooseDate'] }).last().click();
    const day = (value: number) =>
      [...document.querySelectorAll<HTMLButtonElement>('[data-part="table-cell-trigger"]')]
        .filter((button) => button.textContent?.trim() === String(value))
        .at(-1)!;
    await vi.waitFor(() => expect(day(9)).toBeTruthy());
    const before = onchange.mock.calls.length;
    day(9).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(before);
    await view.rerender({ data: { from: '2026-10-12', 'to.date': '2026-10-15' } });
    await vi.waitFor(() => expect(day(11)).toBeTruthy());
    const afterHostReplacement = onchange.mock.calls.length;
    day(11).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(afterHostReplacement);
    day(12).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data['to.date']).toBe('2026-10-12'));
  },
);
it.each(['1/from', '/group.parent/from'])(
  'keeps a %s bound rooted correctly through nested isolated dotted properties',
  async (pointer) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        ajv: createRendererAjv({ $data: true }),
        schema: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: { from: { type: 'string', format: 'date' } },
            additionalProperties: {
              type: 'string',
              format: 'date',
              formatMinimum: { $data: pointer },
            },
          } as JsonSchema7,
        },
        data: { 'group.parent': { from: '2026-10-10', 'to.date': '2026-10-15' } },
        uischema: { type: 'Control', scope: '#' },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    await page.getByRole('button', { name: messages.en['temporal.chooseDate'] }).last().click();
    const day = (value: number) =>
      [...document.querySelectorAll<HTMLButtonElement>('[data-part="table-cell-trigger"]')]
        .filter((button) => button.textContent?.trim() === String(value))
        .at(-1)!;
    await vi.waitFor(() => expect(day(9)).toBeTruthy());
    const before = onchange.mock.calls.length;
    day(9).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(before);
    await view.rerender({
      data: { 'group.parent': { from: '2026-10-12', 'to.date': '2026-10-15' } },
    });
    await vi.waitFor(() => expect(day(11)).toBeTruthy());
    const afterHostReplacement = onchange.mock.calls.length;
    day(11).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(afterHostReplacement);
    day(12).click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data['group.parent']['to.date']).toBe('2026-10-12'),
    );
  },
  30_000,
);
it.each(['1/from', '/group.parent/from'])(
  'keeps a %s bound rooted correctly for an ordinary date child of a literal object',
  async (pointer) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        ajv: createRendererAjv({ $data: true }),
        schema: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              from: { type: 'string', format: 'date' },
              to: {
                type: 'string',
                format: 'date',
                formatMinimum: { $data: pointer },
              },
            },
          } as JsonSchema7,
        },
        data: { 'group.parent': { from: '2026-10-10', to: '2026-10-15' } },
        uischema: { type: 'Control', scope: '#' },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    await page.getByRole('button', { name: messages.en['temporal.chooseDate'] }).last().click();
    const day = (value: number) =>
      [...document.querySelectorAll<HTMLButtonElement>('[data-part="table-cell-trigger"]')]
        .filter((button) => button.textContent?.trim() === String(value))
        .at(-1)!;
    await vi.waitFor(() => expect(day(9)).toBeTruthy());
    const before = onchange.mock.calls.length;
    day(9).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(before);
    await view.rerender({
      data: { 'group.parent': { from: '2026-10-12', to: '2026-10-15' } },
    });
    await vi.waitFor(() => expect(day(11)).toBeTruthy());
    const afterHostReplacement = onchange.mock.calls.length;
    day(11).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(afterHostReplacement);
    day(12).click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data['group.parent'].to).toBe('2026-10-12'),
    );
  },
);
it.each(['1/from', '/group.parent/from'])(
  'retains a typed date violation at an ordinary child of a literal object with %s',
  async (pointer) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        ajv: createRendererAjv({ $data: true }),
        config: { dateFormat: 'YYYY-MM-DD', mask: false },
        schema: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              from: { type: 'string', format: 'date' },
              to: {
                type: 'string',
                format: 'date',
                formatMinimum: { $data: pointer },
              },
            },
          } as JsonSchema7,
        },
        data: { 'group.parent': { from: '2026-10-10', to: '2026-10-15' } },
        uischema: { type: 'Control', scope: '#' },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
      (element) => element.value === '2026-10-15',
    )!;
    expect(input).toBeTruthy();
    input.value = '2026-10-09';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.blur();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data['group.parent'].to).toBe('2026-10-09'),
    );
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ keyword: 'formatMinimum' })]),
    );
    await vi.waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(view.container.querySelector('[role="alert"]')).toBeTruthy();
  },
);
it.each([
  { pointer: '1/from', composed: false },
  { pointer: '/from', composed: false },
  { pointer: '1/from', composed: true },
  { pointer: '/from', composed: true },
])(
  'resolves a $pointer bound for a literal dotted date whose schema is referenced and composed=$composed',
  async ({ pointer, composed }) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        ajv: createRendererAjv({ $data: true }),
        schema: {
          type: 'object',
          properties: { from: { type: 'string', format: 'date' } },
          $defs: {
            boundedDate: composed
              ? {
                  allOf: [
                    { type: 'string', format: 'date' },
                    { type: 'string', format: 'date', formatMinimum: { $data: pointer } },
                  ],
                }
              : {
                  type: 'string',
                  format: 'date',
                  formatMinimum: { $data: pointer },
                },
          },
          additionalProperties: { $ref: '#/$defs/boundedDate' },
        } as JsonSchema7,
        data: { from: '2026-10-10', 'to.date': '2026-10-15' },
        uischema: { type: 'Control', scope: '#' },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    await page.getByRole('button', { name: messages.en['temporal.chooseDate'] }).last().click();
    const day = (value: number) =>
      [...document.querySelectorAll<HTMLButtonElement>('[data-part="table-cell-trigger"]')]
        .filter((button) => button.textContent?.trim() === String(value))
        .at(-1)!;
    await vi.waitFor(() => expect(day(9)).toBeTruthy());
    const before = onchange.mock.calls.length;
    day(9).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(before);
    await view.rerender({ data: { from: '2026-10-12', 'to.date': '2026-10-15' } });
    await vi.waitFor(() => expect(day(11)).toBeTruthy());
    const afterHostReplacement = onchange.mock.calls.length;
    day(11).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(afterHostReplacement);
    day(12).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data['to.date']).toBe('2026-10-12'));
  },
);
it.each([
  { pointer: '1/from', referenced: false },
  { pointer: '/from', referenced: false },
  { pointer: '1/from', referenced: true },
  { pointer: '/from', referenced: true },
  { pointer: '1/from', referenced: true, composed: true },
  { pointer: '/from', referenced: true, composed: true },
])(
  'retains typed date violations for a dotted property with $pointer, referenced=$referenced, composed=$composed',
  async ({ pointer, referenced, composed }) => {
    const bound = {
      type: 'string',
      format: 'date',
      formatMinimum: { $data: pointer },
    };
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        ajv: createRendererAjv({ $data: true }),
        config: { dateFormat: 'YYYY-MM-DD', mask: false },
        schema: {
          type: 'object',
          properties: { from: { type: 'string', format: 'date' } },
          ...(referenced
            ? {
                $defs: { boundedDate: composed ? { allOf: [bound] } : bound },
                additionalProperties: { $ref: '#/$defs/boundedDate' },
              }
            : { additionalProperties: bound }),
        } as JsonSchema7,
        data: { from: '2026-10-10', 'to.date': '2026-10-15' },
        uischema: { type: 'Control', scope: '#' },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    const input = Array.from(view.container.querySelectorAll<HTMLInputElement>('input')).find(
      (element) => element.value === '2026-10-15',
    )!;
    expect(input).toBeTruthy();
    input.value = '2026-10-09';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.blur();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data['to.date']).toBe('2026-10-09'));
    expect(onchange.mock.lastCall?.[0].errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ keyword: 'formatMinimum' })]),
    );
    await vi.waitFor(() => expect(input.getAttribute('aria-invalid')).toBe('true'));
    expect(view.container.querySelector('[role="alert"]')).toBeTruthy();
  },
);
it.each([
  { pointer: '1/from', composed: false },
  { pointer: '/group.parent/from', composed: false },
  { pointer: '1/from', composed: true },
  { pointer: '/group.parent/from', composed: true },
])(
  'resolves a $pointer bound for a referenced date nested under a literal dotted object with composed=$composed',
  async ({ pointer, composed }) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        ajv: createRendererAjv({ $data: true }),
        schema: {
          type: 'object',
          $defs: {
            boundedDate: composed
              ? {
                  allOf: [
                    { type: 'string', format: 'date' },
                    { type: 'string', format: 'date', formatMinimum: { $data: pointer } },
                  ],
                }
              : {
                  type: 'string',
                  format: 'date',
                  formatMinimum: { $data: pointer },
                },
          },
          additionalProperties: {
            type: 'object',
            properties: { from: { type: 'string', format: 'date' } },
            additionalProperties: { $ref: '#/$defs/boundedDate' },
          },
        } as JsonSchema7,
        data: { 'group.parent': { from: '2026-10-10', 'to.date': '2026-10-15' } },
        uischema: { type: 'Control', scope: '#' },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    const triggers = view.container.querySelectorAll<HTMLButtonElement>(
      `button[aria-label="${messages.en['temporal.chooseDate']}"]`,
    );
    expect(triggers).toHaveLength(2);
    triggers[1].click();
    await new Promise(requestAnimationFrame);
    const day = (value: number) =>
      [...document.querySelectorAll<HTMLButtonElement>('[data-part="table-cell-trigger"]')]
        .filter((button) => button.textContent?.trim() === String(value))
        .at(-1)!;
    await vi.waitFor(() => expect(day(9)).toBeTruthy());
    const before = onchange.mock.calls.length;
    day(9).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(before);
    await view.rerender({
      data: { 'group.parent': { from: '2026-10-12', 'to.date': '2026-10-15' } },
    });
    await vi.waitFor(() => expect(day(11)).toBeTruthy());
    const afterHostReplacement = onchange.mock.calls.length;
    day(11).click();
    await new Promise(requestAnimationFrame);
    expect(onchange.mock.calls.length).toBe(afterHostReplacement);
    day(12).click();
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data['group.parent']['to.date']).toBe('2026-10-12'),
    );
  },
  60_000,
);
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
  await view.rerender({ config: { restrict: false } });
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
        uischema: { ...control, options: { ...control.options, showActions: true } },
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
