import '../test.css';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { JsonSchema7 } from '@jsonforms/core';
import { skeletonRenderers } from '../../src/lib/renderers';
import { mountForm } from '../testUtils';

afterEach(cleanup);

it.each([
  {
    kind: 'date',
    value: '2026-10-14',
    partial: '2026-10-1',
    complete: '2026-10-15',
    stored: '2026-10-15',
  },
  { kind: 'time', value: '13:15:00', partial: '13:1', complete: '09:30', stored: '09:30:00' },
  {
    kind: 'date-time',
    value: '2026-10-14T13:15:00Z',
    partial: '2026-10-1',
    complete: '2026-10-15 09:30',
    stored: '2026-10-15T09:30:00Z',
  },
] as const)('blocks a collection action while $kind text is incomplete', async (item) => {
  const { view, onchange } = await mountForm({
    renderers: skeletonRenderers,
    schema: {
      type: 'object',
      properties: {
        when: { type: 'string', format: item.kind },
        items: { type: 'array', items: { type: 'string' } },
      },
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/when', options: { mask: false } },
        { type: 'Control', scope: '#/properties/items' },
      ],
    },
    data: { when: item.value, items: [] },
    config: {
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm',
      timeSaveFormat: 'HH:mm:ss',
      dateTimeFormat: 'YYYY-MM-DD HH:mm',
      dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[id*="when"][id$="-input"]')!;
  const beforeDraft = onchange.mock.calls.length;
  input.value = item.partial;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() => expect(input.value).toBe(item.partial));
  const hintId = `${input.id.slice(0, -'-input'.length)}-draft-hint`;
  await vi.waitFor(() => expect(input.getAttribute('aria-describedby')).toContain(hintId));
  expect(document.getElementById(hintId)?.textContent).toContain(
    item.kind === 'date'
      ? 'Enter a valid date'
      : item.kind === 'time'
        ? 'Enter a valid time'
        : 'Enter a valid date and time',
  );
  expect(onchange.mock.calls.length).toBe(beforeDraft);
  const addItem = view.container.querySelector<HTMLButtonElement>(
    'button[aria-label="Add to Items button"]',
  )!;
  addItem.click();
  await new Promise((resolve) => setTimeout(resolve, 20));
  expect(onchange.mock.lastCall?.[0].data.items).toEqual([]);
  input.value = item.complete;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.when).toBe(item.stored));
  await vi.waitFor(() =>
    expect(input.getAttribute('aria-describedby') ?? '').not.toContain('-draft-hint'),
  );
  addItem.click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data.items).toEqual(['']));
});

it.each([
  {
    kind: 'date',
    value: '2026-10-14',
    partial: '2026-10-1',
    replacement: '2026-11-03',
    shown: '2026-11-03',
    formatKey: 'dateFormat',
    format: 'YYYY-MM-DD',
  },
  {
    kind: 'time',
    value: '13:15:00',
    partial: '13:1',
    replacement: '09:30:00',
    shown: '09:30',
    formatKey: 'timeFormat',
    format: 'HH:mm',
  },
] as const)('keeps partial $kind typing local and drops it on host replacement', async (item) => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', format: item.kind },
      data: item.value,
      uischema: { type: 'Control', scope: '#', options: { mask: false } },
      config: { [item.formatKey]: item.format },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  input.value = item.partial;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() => expect(input.value).toBe(item.partial));
  expect(onchange.mock.calls.every(([event]) => event.data !== item.partial)).toBe(true);
  await view.rerender({ data: item.replacement });
  await vi.waitFor(() => expect(input.value).toBe(item.shown));
});

it('keeps partial date-time typing local and drops it on host replacement', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'date-time' },
      data: '2026-10-14T13:15:00Z',
      uischema: { type: 'Control', scope: '#', options: { mask: false } },
      config: {
        dateTimeFormat: 'YYYY-MM-DD HH:mm',
        dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
      },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  input.value = '2026-10-1';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await vi.waitFor(() => expect(input.value).toBe('2026-10-1'));
  expect(onchange.mock.calls.every(([event]) => event.data !== '2026-10-1')).toBe(true);
  await view.rerender({ data: '2026-11-03T09:30:00Z' });
  await vi.waitFor(() => expect(input.value).toMatch(/^2026-11-03 \d\d:30$/));
});

it('keeps a partial date-time draft across locale changes but not a new control path', async () => {
  const schema = {
    type: 'object',
    properties: {
      first: { type: 'string', format: 'date-time' },
      second: { type: 'string', format: 'date-time' },
    },
  };
  const view = await render(JsonForms, {
    props: {
      schema,
      data: { first: '2026-10-14T13:15:00Z', second: '2026-11-03T09:30:00Z' },
      uischema: { type: 'Control', scope: '#/properties/first', options: { mask: false } },
      config: { dateTimeFormat: 'YYYY-MM-DD HH:mm' },
      renderers: skeletonRenderers,
    },
  });
  const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
  input.value = '2026-10-1';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await view.rerender({ i18n: { locale: 'bg' } });
  expect(input.value).toBe('2026-10-1');
  await vi.waitFor(() =>
    expect(view.container.querySelector('[role="note"]')?.textContent).toContain(
      'Въведете валидна дата и час',
    ),
  );
  await view.rerender({
    uischema: { type: 'Control', scope: '#/properties/second', options: { mask: false } },
  });
  await vi.waitFor(() => expect(input.value).toMatch(/^2026-11-03 \d\d:30$/));
  await vi.waitFor(() => expect(view.container.querySelector('[role="note"]')).toBeNull());
});

it('discards an open date-time draft when the host replaces its value', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'date-time' },
      data: '2026-10-14T13:15:00Z',
      uischema: { type: 'Control', scope: '#', options: { mask: false, showActions: true } },
      config: {
        dateTimeFormat: 'YYYY-MM-DD HH:mm',
        dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
      },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  const trigger = view.container.querySelector<HTMLButtonElement>('button[aria-label]')!;
  trigger.click();
  await vi.waitFor(() => expect(document.querySelector('input[aria-label="Hours"]')).toBeTruthy());
  await page.getByRole('button', { name: 'Increase Hours' }).click();
  await view.rerender({ data: '2026-11-03T09:30:00Z' });
  await vi.waitFor(() => expect(trigger.getAttribute('data-state')).toBe('closed'));
  expect(onchange.mock.calls.every(([event]) => event.data !== '2026-10-14T14:15:00Z')).toBe(true);
  trigger.click();
  await vi.waitFor(() =>
    expect(document.querySelector<HTMLInputElement>('input[aria-label="Hours"]')?.value).toBe('9'),
  );
});

it.each([
  {
    kind: 'time',
    data: '13:15:07Z',
    displayKey: 'timeFormat',
    saveKey: 'timeSaveFormat',
    display: 'HH:mm',
    save: 'HH:mm:ss[Z]',
    expected: '13:15:08Z',
  },
  {
    kind: 'date-time',
    data: '2026-10-14T13:15:07Z',
    displayKey: 'dateTimeFormat',
    saveKey: 'dateTimeSaveFormat',
    display: 'YYYY-MM-DD HH:mm',
    save: 'YYYY-MM-DDTHH:mm:ss[Z]',
    expected: '2026-10-14T13:15:08Z',
  },
] as const)(
  'preserves and edits seconds selected by views for $kind despite minute-only display',
  async ({ kind, data, displayKey, saveKey, display, save, expected }) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: kind },
        data,
        uischema: {
          type: 'Control',
          scope: '#',
          options: { mask: false, showActions: true, views: ['hours', 'minutes', 'seconds'] },
        },
        config: { [displayKey]: display, [saveKey]: save },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    view.container.querySelector<HTMLButtonElement>('button[aria-label]')!.click();
    const seconds = await vi.waitFor(() => {
      const input = document.querySelector<HTMLInputElement>(
        'input[type="number"][aria-label="Seconds"]',
      );
      expect(input).toBeTruthy();
      return input!;
    });
    expect(seconds.value).toBe('7');
    await page.getByRole('button', { name: 'Increase Seconds' }).click();
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe(expected));
  },
);

const cases = [
  {
    kind: 'date',
    data: '2026-10-14',
    displayKey: 'dateFormat',
    saveKey: 'dateSaveFormat',
    globalDisplay: 'MM/DD/YYYY',
    localDisplay: 'DD.MM.YYYY',
    save: 'YYYY-MM-DD',
    localSave: 'YYYY/MM/DD',
    shown: '10/14/2026',
    localShown: '14.10.2026',
    edited: '10/15/2026',
    stored: '2026-10-15',
    localStored: '2026/10/15',
  },
  {
    kind: 'time',
    data: '13:15:00',
    displayKey: 'timeFormat',
    saveKey: 'timeSaveFormat',
    globalDisplay: 'HH:mm',
    localDisplay: 'hh:mm A',
    save: 'HH:mm:ss',
    localSave: 'HH.mm.ss',
    shown: '13:15',
    localShown: '01:15 PM',
    edited: '14:20',
    stored: '14:20:00',
    localStored: '14.20.00',
  },
  {
    kind: 'date-time',
    data: '2026-10-14T13:15:00Z',
    displayKey: 'dateTimeFormat',
    saveKey: 'dateTimeSaveFormat',
    globalDisplay: 'MM/DD/YYYY HH:mm',
    localDisplay: 'DD.MM.YYYY HH:mm',
    save: 'YYYY-MM-DDTHH:mm:ss[Z]',
    localSave: 'YYYY-MM-DDTHH:mm:ss.SSS[Z]',
    shown: '10/14/2026 13:15',
    localShown: '14.10.2026 13:15',
    edited: '10/15/2026 14:20',
    stored: '2026-10-15T14:20:00Z',
    localStored: '2026-10-15T14:20:00.000Z',
  },
] as const;

for (const item of cases) {
  it(`applies flat ${item.kind} display/save formats and persists edited data`, async () => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: item.kind },
        data: item.data,
        uischema: { type: 'Control', scope: '#', options: { mask: false } },
        config: { [item.displayKey]: item.globalDisplay, [item.saveKey]: item.save },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
    expect(input).toBeTruthy();
    await vi.waitFor(() => expect(input.value).toBe(item.shown));
    input.value = item.edited;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe(item.stored));
  });

  it(`lets local ${item.kind} display format override flat config`, async () => {
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: item.kind },
        data: item.data,
        uischema: {
          type: 'Control',
          scope: '#',
          options: { mask: false, [item.displayKey]: item.localDisplay },
        },
        config: { [item.displayKey]: item.globalDisplay, [item.saveKey]: item.save },
        renderers: skeletonRenderers,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
    await vi.waitFor(() => expect(input.value).toBe(item.localShown));
  });

  it(`lets local ${item.kind} save format override flat config`, async () => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: item.kind },
        data: item.kind === 'date-time' ? '2026-10-14T13:15:00.000Z' : item.data,
        uischema: {
          type: 'Control',
          scope: '#',
          options: { mask: false, [item.saveKey]: item.localSave },
        },
        config: { [item.displayKey]: item.globalDisplay, [item.saveKey]: item.save },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input[id$="-input"]')!;
    await vi.waitFor(() => expect(input.value).toBe(item.shown));
    input.value = item.edited;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe(item.localStored));
  });
}

it.each([
  { options: {}, expected: ['Hours'] },
  { options: { views: ['minutes'] }, expected: ['Minutes'] },
])(
  'applies flat/local time columns without changing save format',
  async ({ options, expected }) => {
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: 'time' },
        data: '13:15:00',
        uischema: { type: 'Control', scope: '#', options: { mask: false, ...options } },
        config: { views: ['hours'], timeSaveFormat: 'HH:mm:ss' },
        renderers: skeletonRenderers,
      },
    });
    const trigger = view.container.querySelector<HTMLButtonElement>('button[aria-label]')!;
    expect(trigger).toBeTruthy();
    trigger.click();
    await vi.waitFor(() =>
      expect(
        Array.from(document.querySelectorAll<HTMLInputElement>('input[type="number"][aria-label]'))
          .filter((input) => input.checkVisibility())
          .map((input) => input.getAttribute('aria-label')),
      ).toEqual(expected),
    );
  },
);

it.each([
  { options: {}, month: true },
  { options: { views: ['day'] }, month: false },
])('applies flat date views independently of daily storage', async ({ options, month }) => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'date' },
      data: '2026-10-14',
      uischema: { type: 'Control', scope: '#', options: { mask: false, ...options } },
      config: { views: ['year', 'month'], dateSaveFormat: 'YYYY-MM-DD' },
      renderers: skeletonRenderers,
    },
  });
  const trigger = view.container.querySelector<HTMLButtonElement>('button[aria-label]')!;
  expect(trigger).toBeTruthy();
  trigger.click();
  await vi.waitFor(() =>
    expect(Boolean(document.querySelector('select[aria-label="Month"]'))).toBe(month),
  );
});

it('uses display format for calendar mode when views are absent', async () => {
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'date' },
      data: '2026-10-14',
      uischema: { type: 'Control', scope: '#', options: { mask: false } },
      config: { dateFormat: 'YYYY-MM', dateSaveFormat: 'YYYY-MM-DD' },
      renderers: skeletonRenderers,
    },
  });
  view.container.querySelector<HTMLButtonElement>('button[aria-label]')!.click();
  await vi.waitFor(() =>
    expect(Boolean(document.querySelector('select[aria-label="Month"]'))).toBe(true),
  );
});

it.each([
  { options: {}, month: true, expected: '2026-11-14T13:15:00Z' },
  { options: { views: ['year', 'hours'] }, month: false, expected: '2027-10-14T13:15:00Z' },
])(
  'stages date-time calendar views without changing stored time',
  async ({ options, month, expected }) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: 'date-time' },
        data: '2026-10-14T13:15:00Z',
        uischema: { type: 'Control', scope: '#', options: { mask: false, ...options } },
        config: {
          views: ['year', 'month', 'minutes'],
          showActions: true,
          dateTimeFormat: 'YYYY-MM-DD HH:mm',
          dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    view.container.querySelector<HTMLButtonElement>('button[aria-label]')!.click();
    await vi.waitFor(() =>
      expect(Boolean(document.querySelector('select[aria-label="Month"]'))).toBe(month),
    );
    if (month) await page.getByRole('combobox', { name: 'Month' }).selectOptions('11');
    else await page.getByRole('combobox', { name: 'Year' }).selectOptions('2027');
    expect(onchange.mock.lastCall?.[0].data ?? '2026-10-14T13:15:00Z').toBe('2026-10-14T13:15:00Z');
    await page.getByRole('button', { name: 'OK', exact: true }).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe(expected));
  },
);

it.each([
  {
    kind: 'date',
    data: '2026-10-14',
    expected: '2026-11-14',
    globalActions: undefined,
    localActions: undefined,
  },
  {
    kind: 'date-time',
    data: '2026-10-14T13:15:00Z',
    expected: '2026-11-14T13:15:00Z',
    globalActions: true,
    localActions: false,
  },
])(
  'commits coarse $kind views immediately when actions are off',
  async ({ kind, data, expected, globalActions, localActions }) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: kind },
        data,
        uischema: {
          type: 'Control',
          scope: '#',
          options: {
            mask: false,
            ...(localActions === undefined ? {} : { showActions: localActions }),
          },
        },
        config: {
          views: ['year', 'month'],
          ...(globalActions === undefined ? {} : { showActions: globalActions }),
          dateFormat: 'YYYY-MM-DD',
          dateSaveFormat: 'YYYY-MM-DD',
          dateTimeFormat: 'YYYY-MM-DD HH:mm',
          dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    view.container.querySelector<HTMLButtonElement>('button[aria-label]')!.click();
    await vi.waitFor(() =>
      expect(Boolean(document.querySelector('select[aria-label="Month"]'))).toBe(true),
    );
    expect(page.getByRole('button', { name: 'OK', exact: true }).query()).toBeNull();
    await page.getByRole('combobox', { name: 'Month' }).selectOptions('11');
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe(expected));
    await page.getByRole('combobox', { name: 'Year' }).selectOptions('2027');
    await vi.waitFor(() =>
      expect(onchange.mock.lastCall?.[0].data).toBe(expected.replace('2026', '2027')),
    );
  },
);

for (const kind of ['date', 'time', 'date-time'] as const) {
  it.each([
    {
      name: 'flat',
      config: { okLabel: 'Global save', cancelLabel: 'Global discard' },
      options: {},
      expected: ['Global save', 'Global discard'],
    },
    {
      name: 'local',
      config: { okLabel: 'Global save', cancelLabel: 'Global discard' },
      options: { okLabel: 'Local save', cancelLabel: 'Local discard' },
      expected: ['Local save', 'Local discard'],
    },
    {
      name: 'removed namespace',
      config: { jsonformsExtended: { okLabel: 'Legacy save', cancelLabel: 'Legacy discard' } },
      options: {},
      expected: ['OK', 'Cancel'],
    },
  ])(`resolves ${kind} $name picker labels`, async ({ config, options, expected }) => {
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: kind },
        data:
          kind === 'date' ? '2026-10-14' : kind === 'time' ? '13:15:00' : '2026-10-14T13:15:00Z',
        uischema: { type: 'Control', scope: '#', options: { mask: false, ...options } },
        config: { showActions: true, ...config },
        renderers: skeletonRenderers,
      },
    });
    view.container.querySelector<HTMLButtonElement>('button[aria-label]')!.click();
    await vi.waitFor(() =>
      expect(page.getByRole('button', { name: expected[0], exact: true }).query()).not.toBeNull(),
    );
    expect(page.getByRole('button', { name: expected[1], exact: true }).query()).not.toBeNull();
  });
}

for (const kind of ['time', 'date-time'] as const) {
  it.each([
    { config: { ampm: true }, options: {}, visible: true },
    { config: { ampm: true }, options: { ampm: false }, visible: false },
    { config: { ampm: false }, options: { ampm: true }, visible: true },
  ])(`applies flat/local 12-hour picker mode for ${kind}`, async ({ config, options, visible }) => {
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: kind },
        data: kind === 'time' ? '13:15:00' : '2026-10-14T13:15:00Z',
        uischema: { type: 'Control', scope: '#', options: { mask: false, ...options } },
        config: {
          ...config,
          timeSaveFormat: 'HH:mm:ss',
          dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        },
        renderers: skeletonRenderers,
      },
    });
    const trigger = view.container.querySelector<HTMLButtonElement>('button[aria-label]')!;
    expect(trigger).toBeTruthy();
    trigger.click();
    await vi.waitFor(() =>
      expect(
        Array.from(document.querySelectorAll('button')).some(
          (button) => button.textContent?.trim() === 'PM',
        ),
      ).toBe(visible),
    );
  });
}

it('updates 12-hour period names on a locale-only change', async () => {
  const onchange = vi.fn();
  const view = await render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'time' },
      data: '13:15:00',
      uischema: { type: 'Control', scope: '#', options: { mask: false } },
      config: { ampm: true },
      i18n: { locale: 'en' },
      renderers: skeletonRenderers,
      onchange,
    },
  });
  const trigger = view.container.querySelector<HTMLButtonElement>('button[aria-label]')!;
  trigger.click();
  const period = () =>
    document.querySelector<HTMLButtonElement>(
      'button[aria-label="After noon"], button[aria-label="Следобед"]',
    );
  await vi.waitFor(() => expect(period()?.textContent?.trim()).toBe('PM'));
  await view.rerender({ i18n: { locale: 'bg' } });
  await vi.waitFor(() => expect(period()?.textContent?.trim()).toBe('сл. об.'));
  expect(period()?.getAttribute('aria-label')).toBe('Следобед');
  expect(onchange.mock.lastCall?.[0].data).toBe('13:15:00');
});

it.each([
  { actions: false, locale: 'en', explanation: 'Select a date within the allowed range.' },
  { actions: true, locale: 'bg', explanation: 'Изберете дата в допустимия диапазон.' },
])(
  'explains a rejected coarse date choice with actions=$actions',
  async ({ actions, locale, explanation }) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: 'date', formatMinimum: '2026-10-15' } as JsonSchema7,
        data: '2026-10-20',
        uischema: {
          type: 'Control',
          scope: '#',
          options: { mask: false, views: ['year', 'month'], showActions: actions },
        },
        i18n: { locale },
        renderers: skeletonRenderers,
        onchange,
      },
    });

    const input = view.container.querySelector<HTMLInputElement>('input')!;
    view.container.querySelector<HTMLButtonElement>('button[aria-label]')!.click();
    const month = page.getByRole('combobox', { name: locale === 'bg' ? 'Месец' : 'Month' });
    await vi.waitFor(() => expect(month.query()).not.toBeNull());
    const before = onchange.mock.calls.length;
    await month.selectOptions('9');
    await vi.waitFor(() =>
      expect(document.querySelector('[id$="-draft-range"]')?.textContent).toBe(explanation),
    );
    expect(input.getAttribute('aria-describedby')).toContain('draft-range');
    expect(onchange.mock.calls.length).toBe(before);
    if (actions)
      expect(
        (page.getByRole('button', { name: 'Потвърждаване' }).query() as HTMLButtonElement)
          ?.disabled,
      ).toBe(true);
    await month.selectOptions('11');
    await vi.waitFor(() => expect(document.querySelector('[id$="-draft-range"]')).toBeNull());
    if (actions) await page.getByRole('button', { name: 'Потвърждаване' }).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('2026-11-20'));
  },
);

it.each([
  { actions: false, locale: 'en', explanation: 'Select a time within the allowed range.' },
  { actions: true, locale: 'bg', explanation: 'Изберете час в допустимия диапазон.' },
])(
  'explains a rejected time step with actions=$actions',
  async ({ actions, locale, explanation }) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format: 'time', formatMaximum: '09:30:00' } as JsonSchema7,
        data: '09:30:00',
        uischema: {
          type: 'Control',
          scope: '#',
          options: { mask: false, showActions: actions },
        },
        config: { timeFormat: 'HH:mm', timeSaveFormat: 'HH:mm:ss' },
        i18n: { locale },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input')!;
    view.container.querySelector<HTMLButtonElement>('button[aria-label]')!.click();
    const increase = locale === 'bg' ? 'Увеличаване: Минути' : 'Increase Minutes';
    const decrease = locale === 'bg' ? 'Намаляване: Минути' : 'Decrease Minutes';
    await vi.waitFor(() =>
      expect(page.getByRole('button', { name: increase }).query()).not.toBeNull(),
    );
    const before = onchange.mock.calls.length;
    await page.getByRole('button', { name: increase }).click();
    await vi.waitFor(() =>
      expect(document.querySelector('[id$="-draft-range"]')?.textContent).toBe(explanation),
    );
    expect(input.getAttribute('aria-describedby')).toContain('draft-range');
    expect(onchange.mock.calls.length).toBe(before);
    if (actions)
      expect(
        (page.getByRole('button', { name: 'Потвърждаване' }).query() as HTMLButtonElement)
          ?.disabled,
      ).toBe(true);
    await page.getByRole('button', { name: decrease }).click();
    await vi.waitFor(() => expect(document.querySelector('[id$="-draft-range"]')).toBeNull());
    if (actions) await page.getByRole('button', { name: 'Потвърждаване' }).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('09:29:00'));
  },
);

it.each([
  { actions: false, locale: 'en', explanation: 'Select a date and time within the allowed range.' },
  { actions: true, locale: 'bg', explanation: 'Изберете дата и час в допустимия диапазон.' },
])(
  'explains a rejected date-time step with actions=$actions',
  async ({ actions, locale, explanation }) => {
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: {
          type: 'string',
          format: 'date-time',
          formatMaximum: '2026-10-20T09:30:00Z',
        } as JsonSchema7,
        data: '2026-10-20T09:30:00Z',
        uischema: {
          type: 'Control',
          scope: '#',
          options: { mask: false, showActions: actions },
        },
        config: {
          dateTimeFormat: 'YYYY-MM-DD HH:mm',
          dateTimeSaveFormat: 'YYYY-MM-DDTHH:mm:ss[Z]',
        },
        i18n: { locale },
        renderers: skeletonRenderers,
        onchange,
      },
    });
    const input = view.container.querySelector<HTMLInputElement>('input')!;
    view.container.querySelector<HTMLButtonElement>('button[aria-label]')!.click();
    const increase = locale === 'bg' ? 'Увеличаване: Минути' : 'Increase Minutes';
    const decrease = locale === 'bg' ? 'Намаляване: Минути' : 'Decrease Minutes';
    await vi.waitFor(() =>
      expect(page.getByRole('button', { name: increase }).query()).not.toBeNull(),
    );
    const before = onchange.mock.calls.length;
    await page.getByRole('button', { name: increase }).click();
    await vi.waitFor(() =>
      expect(document.querySelector('[id$="-draft-range"]')?.textContent).toBe(explanation),
    );
    expect(input.getAttribute('aria-describedby')).toContain('draft-range');
    expect(onchange.mock.calls.length).toBe(before);
    if (actions)
      expect(
        (page.getByRole('button', { name: 'Потвърждаване' }).query() as HTMLButtonElement)
          ?.disabled,
      ).toBe(true);
    await page.getByRole('button', { name: decrease }).click();
    await vi.waitFor(() => expect(document.querySelector('[id$="-draft-range"]')).toBeNull());
    if (actions) await page.getByRole('button', { name: 'Потвърждаване' }).click();
    await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('2026-10-20T09:29:00Z'));
  },
);
