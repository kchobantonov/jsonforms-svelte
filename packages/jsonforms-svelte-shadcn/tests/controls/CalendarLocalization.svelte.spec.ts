import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { shadcnRenderers } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';

afterEach(async () => {
  await cleanup();
  document.querySelector('[data-bits-announcer]')?.remove();
});
for (const format of ['date', 'date-time']) {
  it(`localizes native ${format} calendar labels and announcements without committing staged data`, async () => {
    const data = format === 'date' ? '2026-05-05' : '2026-05-05T09:30:00';
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format },
        data,
        uischema: { type: 'Control', scope: '#', options: { showActions: true } },
        renderers: shadcnRenderers,
        i18n: { locale: 'bg' },
        onchange,
      },
    });
    const trigger = format === 'date' ? 'temporal.chooseDate' : 'temporal.chooseDateTime';
    await page.getByRole('button', { name: messages.bg[trigger], exact: true }).click();
    await expect
      .element(page.getByRole('button', { name: messages.bg['calendar.nextMonth'], exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByRole('combobox', { name: messages.bg['temporal.month'], exact: true }))
      .toBeVisible();
    const calendar = document.querySelector<HTMLElement>('[data-calendar-root]')!;
    expect(calendar.getAttribute('aria-label')).toContain('Календар');
    await page
      .elementLocator(
        calendar.querySelector<HTMLElement>('[data-calendar-day][data-value="2026-05-06"]')!,
      )
      .click();
    await vi.waitFor(() =>
      expect(document.querySelector('[data-bits-announcer]')?.textContent).toContain(
        'Избрана дата:',
      ),
    );
    await view.rerender({ i18n: { locale: 'en' } });
    await expect
      .element(page.getByRole('button', { name: messages.en['calendar.nextMonth'], exact: true }))
      .toBeVisible();
    const translate = (key: string, fallback?: string) =>
      (
        ({
          'calendar.nextMonth': 'Mois suivant personnalisé',
          'calendar.name': 'Calendrier personnalisé',
          'calendar.selectedDate': 'Date choisie : {date}',
        }) as Record<string, string>
      )[key] ?? fallback;
    await view.rerender({ i18n: { locale: 'fr', translate } });
    await expect
      .element(page.getByRole('button', { name: 'Mois suivant personnalisé', exact: true }))
      .toBeVisible();
    expect(calendar.getAttribute('aria-label')).toContain('Calendrier personnalisé');
    expect(calendar.getAttribute('aria-label')).toContain('mai');
    await page
      .elementLocator(
        calendar.querySelector<HTMLElement>('[data-calendar-day][data-value="2026-05-07"]')!,
      )
      .click();
    await vi.waitFor(() =>
      expect(document.querySelector('[data-bits-announcer]')?.textContent).toContain(
        'Date choisie :',
      ),
    );
    expect(onchange.mock.calls.every(([event]) => event.data === data)).toBe(true);
  });
}

it('keeps native selection announcements translated when selection closes the popup', async () => {
  const onchange = vi.fn();
  await render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'date' },
      data: '2026-05-05',
      uischema: { type: 'Control', scope: '#' },
      renderers: shadcnRenderers,
      i18n: { locale: 'bg' },
      onchange,
    },
  });
  await page.getByRole('button', { name: messages.bg['temporal.chooseDate'], exact: true }).click();
  await page
    .elementLocator(
      document.querySelector<HTMLElement>('[data-calendar-day][data-value="2026-05-06"]')!,
    )
    .click();
  await vi.waitFor(() => expect(onchange.mock.lastCall?.[0].data).toBe('2026-05-06'));
  await vi.waitFor(() => expect(document.querySelector('[data-calendar-root]')).toBeNull());
  const log = document.querySelector('[data-bits-announcer]')?.textContent;
  expect(log).toContain('Избрана дата:');
  expect(log).not.toContain('Selected Date:');
});

it('keeps announcement ownership separate for forms with different locales', async () => {
  const changes = [vi.fn(), vi.fn()];
  const views = await Promise.all(
    ['bg', 'en'].map(
      async (locale, index) =>
        await render(JsonForms, {
          props: {
            schema: { type: 'string', format: 'date' },
            data: '2026-05-05',
            uischema: { type: 'Control', scope: '#' },
            renderers: shadcnRenderers,
            i18n: { locale },
            onchange: changes[index],
          },
        }),
    ),
  );
  for (const [index, locale] of (['bg', 'en'] as const).entries()) {
    await views[index]
      .getByRole('button', { name: messages[locale]['temporal.chooseDate'], exact: true })
      .click();
    const date = `2026-05-0${index + 6}`;
    await page
      .elementLocator(
        document.querySelector<HTMLElement>(`[data-calendar-day][data-value="${date}"]`)!,
      )
      .click();
    await vi.waitFor(() => expect(changes[index].mock.lastCall?.[0].data).toBe(date));
    const expected = messages[locale]['calendar.selectedDate'].split('{date}')[0];
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-bits-announcer] [aria-live="polite"]')?.lastElementChild
          ?.textContent,
      ).toContain(expected),
    );
  }
  expect(changes[0].mock.lastCall?.[0].data).toBe('2026-05-06');
});
