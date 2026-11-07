import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import interpolationTranslations from '@chobantonov/jsonforms-extended-spec/examples/label-interpolation/translations.json';

demoTest('label-interpolation', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) =>
      localStorage.setItem(
        `${family}-example-locale`,
        JSON.stringify({ version: 1, value: locale }),
      ),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-label-interpolation?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const product = locale === 'bg' ? 'Абонирани сте за Atlas.' : 'You are subscribed to Atlas.';
  const seats = locale === 'bg' ? 'Планът ви включва 3 места.' : 'Your plan includes 3 seats.';
  await expect.poll(() => page.getByText(product, { exact: true }).isVisible()).toBe(true);
  await expect.poll(() => page.getByText(seats, { exact: true }).isVisible()).toBe(true);
  await expect
    .poll(() =>
      page
        .getByText(locale === 'bg' ? 'Промоционален код:' : 'Promotional code:', { exact: true })
        .isVisible(),
    )
    .toBe(true);
  expect(await page.locator('[data-markup-diagnostic]:visible').count()).toBe(0);

  await page.getByRole('tab', { name: interpolationTranslations[locale]['Both together'] }).click();
  const summary = page.locator('strong').filter({ hasText: 'Northwind Books' });
  await expect.poll(() => summary.isVisible()).toBe(true);
  expect(await page.getByText('Ana **Petrova**', { exact: false }).isVisible()).toBe(true);
  expect(await page.locator('strong').filter({ hasText: 'Petrova' }).count()).toBe(0);
  expect(await page.locator('[data-markup-diagnostic]:visible').count()).toBe(0);

  await page
    .getByRole('tab', { name: interpolationTranslations[locale]['Locale and translation'] })
    .click();
  await expect
    .poll(() =>
      page
        .getByText(locale === 'bg' ? 'Вашият план е Екип.' : 'Your plan is Team.', {
          exact: true,
        })
        .isVisible(),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.getByText(locale === 'bg' ? '1.10.2026' : 'Oct 1, 2026', { exact: false }).isVisible(),
    )
    .toBe(true);
  await expect
    .poll(() =>
      page.getByText(locale === 'bg' ? '49,50 €' : '€49.50', { exact: false }).isVisible(),
    )
    .toBe(true);

  await page
    .getByRole('tab', { name: interpolationTranslations[locale]['Interpolation off'] })
    .click();
  await expect
    .poll(() => page.getByText('{data.customerName}', { exact: false }).isVisible())
    .toBe(true);
  expect(await page.locator('[data-markup-diagnostic]:visible').count()).toBe(0);

  await page
    .getByRole('tab', { name: interpolationTranslations[locale]['JavaScript names'] })
    .click();
  await expect
    .poll(() => page.getByText('a perfectly ordinary value', { exact: false }).isVisible())
    .toBe(true);
  await expect.poll(() => page.getByText('also ordinary', { exact: false }).isVisible()).toBe(true);
  expect(await page.locator('[data-markup-diagnostic]:visible').count()).toBe(0);

  await page
    .getByRole('tab', { name: interpolationTranslations[locale]['Incorrect usage'] })
    .click();
  await expect
    .poll(() => page.locator('[data-markup-diagnostic="interpolationFailed"]:visible').count())
    .toBe(5);
  expect(errors).toEqual([]);
});

demoTest('label-markup-policy', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) =>
      localStorage.setItem(
        `${family}-example-locale`,
        JSON.stringify({ version: 1, value: locale }),
      ),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-markup-label?use-webcomponent=${webcomponent}&drawer=false`,
  );

  await expect.poll(() => page.locator('strong').first().isVisible()).toBe(true);
  const venue = page.getByRole('link', {
    name: locale === 'bg' ? 'бележките за достъп до залата' : 'venue access notes',
  });
  expect(await venue.getAttribute('href')).toBe('https://example.com/venue');

  await page
    .getByRole('tab', {
      name: locale === 'bg' ? 'Заглавия и обикновен текст' : 'Headings and literal text',
    })
    .click();
  await expect
    .poll(() =>
      page
        .getByText(locale === 'bg' ? 'старата страница с условия' : 'old policy page')
        .isVisible(),
    )
    .toBe(true);
  expect(await page.locator('[data-markup-diagnostic="urlRefused"]').count()).toBe(0);
  expect(
    await page
      .getByRole('link', {
        name: locale === 'bg' ? 'старата страница с условия' : 'old policy page',
      })
      .count(),
  ).toBe(0);

  await page
    .getByRole('tab', {
      name: locale === 'bg' ? 'Настройки за маркиране' : 'Markup options',
    })
    .click();
  expect(await page.locator('[data-markup-diagnostic="markupUnsupported"]').count()).toBe(0);
  expect(
    await page
      .getByText(locale === 'bg' ? 'Това съобщение е написано' : 'This notice was authored', {
        exact: false,
      })
      .isVisible(),
  ).toBe(true);
  await applyDemoEditor(page, locale, 'UI Schema', {
    type: 'Link',
    label: 'Unsafe destination',
    href: 'java\nscript:alert(1)',
  });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await expect.poll(() => page.locator('[data-link-inert]:visible').count()).toBe(1);
  expect(await page.locator('[data-link-inert]:visible').textContent()).toBe('Unsafe destination');
  expect(await page.getByRole('link', { name: 'Unsafe destination' }).count()).toBe(0);
  expect(errors).toEqual([]);
});

demoTest('label-markdown-url-components', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) =>
      localStorage.setItem(
        `${family}-example-locale`,
        JSON.stringify({ version: 1, value: locale }),
      ),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-label-interpolation?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await applyDemoEditor(page, locale, 'UI Schema', {
    type: 'Label',
    text: '[Open](https://example.com/items/{slug})',
    options: {
      markup: 'markdown',
      interpolate: true,
      textParams: { slug: '{data.slug}' },
    },
  });
  await applyDemoEditor(page, locale, 'Data', { slug: 'a/b?x=1&y=2' });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  const link = page.getByRole('link', { name: 'Open', exact: true });
  await expect
    .poll(() => link.getAttribute('href'))
    .toBe('https://example.com/items/a%2Fb%3Fx%3D1%26y%3D2');
  expect(await page.locator('[data-markup-diagnostic]:visible').count()).toBe(0);

  await applyDemoEditor(page, locale, 'Data', { slug: 'javascript:alert(1)#next' });
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await expect
    .poll(() => link.getAttribute('href'))
    .toBe('https://example.com/items/javascript%3Aalert%281%29%23next');
  expect(errors).toEqual([]);
});
