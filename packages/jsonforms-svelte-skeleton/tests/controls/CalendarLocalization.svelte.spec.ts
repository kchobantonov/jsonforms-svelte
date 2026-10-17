import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { skeletonRenderers } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vitest';
import { page } from 'vitest/browser';
import { cleanup, render } from 'vitest-browser-svelte';

afterEach(cleanup);

for (const format of ['date', 'date-time']) {
  it(`localizes native ${format} calendar navigation and live host translations`, async () => {
    const data = format === 'date' ? '2026-05-05' : '2026-05-05T09:30:00';
    const onchange = vi.fn();
    const view = render(JsonForms, {
      props: {
        schema: { type: 'string', format },
        data,
        uischema: { type: 'Control', scope: '#' },
        renderers: skeletonRenderers,
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
      .element(page.getByRole('application', { name: messages.bg['calendar.name'], exact: true }))
      .toBeVisible();
    const selected = document.querySelector(
      '[data-scope="date-picker"][data-part="view"][data-view="day"] [data-part="table-cell-trigger"][data-selected]',
    );
    expect(selected?.getAttribute('aria-label')).toContain('Избрана дата:');
    expect(selected?.getAttribute('aria-label')).toContain('май');
    await view.rerender({ i18n: { locale: 'en' } });
    await expect
      .element(page.getByRole('button', { name: messages.en['calendar.nextMonth'], exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByRole('application', { name: messages.en['calendar.name'], exact: true }))
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
    await expect
      .element(page.getByRole('application', { name: 'Calendrier personnalisé', exact: true }))
      .toBeVisible();
    expect(selected?.getAttribute('aria-label')).toContain('Date choisie :');
    expect(selected?.getAttribute('aria-label')).toContain('mai');
    expect(onchange.mock.calls.every(([event]) => event.data === data)).toBe(true);
  });
}

it('preserves explicit native translation overrides without losing other catalog labels', async () => {
  render(JsonForms, {
    props: {
      schema: { type: 'string', format: 'date' },
      data: '2026-05-05',
      uischema: {
        type: 'Control',
        scope: '#',
        options: {
          skeleton: { DatePicker: { translations: { nextTrigger: () => 'Native override' } } },
        },
      },
      renderers: skeletonRenderers,
      i18n: { locale: 'bg' },
    },
  });
  await page.getByRole('button', { name: messages.bg['temporal.chooseDate'], exact: true }).click();
  await expect
    .element(page.getByRole('button', { name: 'Native override', exact: true }))
    .toBeVisible();
  await expect
    .element(page.getByRole('button', { name: messages.bg['calendar.previousMonth'], exact: true }))
    .toBeVisible();
});
