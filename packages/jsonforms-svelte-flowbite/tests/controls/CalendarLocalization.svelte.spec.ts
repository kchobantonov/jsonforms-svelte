import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import messages from '../../../jsonforms-svelte/src/lib/locales/messages.json';
import { flowbiteRenderers } from '../../src/lib';
import { afterEach, expect, it, vi } from 'vite-plus/test';
import { page } from 'vite-plus/test/browser';
import { cleanup, render } from 'vitest-browser-svelte';

afterEach(cleanup);
for (const format of ['date', 'date-time']) {
  it(`localizes native ${format} calendar navigation across views and host locales`, async () => {
    const data = format === 'date' ? '2026-05-05' : '2026-05-05T09:30:00';
    const onchange = vi.fn();
    const view = await render(JsonForms, {
      props: {
        schema: { type: 'string', format },
        data,
        uischema: { type: 'Control', scope: '#' },
        renderers: flowbiteRenderers,
        i18n: { locale: 'bg' },
        onchange,
      },
    });
    const trigger = format === 'date' ? 'temporal.openDate' : 'temporal.openDateTime';
    await page.getByRole('button', { name: messages.bg[trigger], exact: true }).click();
    await expect
      .element(page.getByRole('button', { name: messages.bg['calendar.nextMonth'], exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByRole('dialog', { name: messages.bg['calendar.name'], exact: true }))
      .toBeVisible();
    const month = Array.from(
      document.querySelectorAll<HTMLButtonElement>('[id="datepicker-dropdown"] button'),
    ).find((button) => button.textContent?.includes('май'))!;
    expect(month).toBeTruthy();
    month.click();
    await expect
      .element(page.getByRole('button', { name: messages.bg['calendar.nextYear'], exact: true }))
      .toBeVisible();
    await view.rerender({ i18n: { locale: 'en' } });
    await expect
      .element(page.getByRole('button', { name: messages.en['calendar.nextYear'], exact: true }))
      .toBeVisible();
    const translate = (key: string, fallback?: string) =>
      (
        {
          'calendar.nextYear': 'Année suivante personnalisée',
          'calendar.name': 'Calendrier personnalisé',
        } as Record<string, string>
      )[key] ?? fallback;
    await view.rerender({ i18n: { locale: 'fr', translate } });
    await expect
      .element(page.getByRole('button', { name: 'Année suivante personnalisée', exact: true }))
      .toBeVisible();
    await expect
      .element(page.getByRole('dialog', { name: 'Calendrier personnalisé', exact: true }))
      .toBeVisible();
    expect(onchange.mock.calls.every(([event]) => event.data === data)).toBe(true);
  });
}
