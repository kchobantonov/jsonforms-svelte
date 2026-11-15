import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'job application host actions change language and theme',
  async ({ page, family, webcomponent, base }) => {
    await page.goto(
      `${base}/${family}/#/examples/spec-job-application?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await expect.poll(() => page.getByRole('textbox', { name: 'First Name' }).count()).toBe(1);

    const isDark = () =>
      page.locator('html').evaluate((html) => {
        const mode = html.getAttribute('data-mode');
        return mode
          ? mode === 'dark' ||
              (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
          : html.classList.contains('dark');
      });
    const wasDark = await isDark();
    const shellMode = await page.locator('html').evaluate((html) => ({
      className: html.className,
      mode: html.getAttribute('data-mode'),
      lang: html.getAttribute('lang'),
    }));
    const formMode = () =>
      webcomponent
        ? page.locator(`jsonforms-svelte-${family}`).getAttribute('data-mode')
        : page.getByRole('textbox', { name: 'First Name' }).evaluate((input) => {
            const wrapper = input.closest(
              '.json-forms .light, .json-forms .dark, [data-mode="light"], [data-mode="dark"]',
            );
            if (!wrapper) return null;
            return (
              wrapper.getAttribute('data-mode') ??
              (wrapper.classList.contains('dark') ? 'dark' : 'light')
            );
          });

    await page.getByRole('button', { name: 'Toggle Theme' }).click();
    await expect.poll(formMode).toBe(wasDark ? 'light' : 'dark');
    await expect(isDark()).resolves.toBe(wasDark);
    await expect(
      page.locator('html').evaluate((html) => ({
        className: html.className,
        mode: html.getAttribute('data-mode'),
        lang: html.getAttribute('lang'),
      })),
    ).resolves.toEqual(shellMode);

    await page.getByRole('button', { name: 'Toggle Theme' }).click();
    await expect.poll(formMode).toBe(wasDark ? 'dark' : 'light');
    await expect(isDark()).resolves.toBe(wasDark);

    await page.getByRole('button', { name: 'Български' }).click();
    await expect.poll(() => page.getByRole('textbox', { name: 'Първо име' }).count()).toBe(1);
    await expect
      .poll(() => page.getByText('Кандидатстване за работа', { exact: true }).count())
      .toBe(1);
    await expect
      .poll(() => page.getByText('Информация за адреса', { exact: true }).count())
      .toBe(1);
    await expect(page.locator('html').getAttribute('lang')).resolves.toBe(shellMode.lang);

    await page.getByRole('button', { name: 'English' }).click();
    await expect.poll(() => page.getByRole('textbox', { name: 'First Name' }).count()).toBe(1);
  },
  { locales: ['en'], timeout: 45_000 },
);

demoTest(
  'job application can use a light form in a system dark page',
  async ({ page, family, webcomponent, base }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(
      `${base}/${family}/#/examples/spec-job-application?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const firstName = page.getByRole('textbox', { name: 'First Name' });
    await expect.poll(() => firstName.count()).toBe(1);
    await page.getByRole('button', { name: 'Toggle Theme' }).click();
    await expect
      .poll(() =>
        firstName.evaluate((input) => ({
          colorScheme: getComputedStyle(input).colorScheme,
          card: getComputedStyle(input).getPropertyValue('--card').trim(),
        })),
      )
      .toEqual({ colorScheme: 'light', card: '0 0% 100%' });
    await expect.poll(() => page.locator('html').getAttribute('data-mode')).toBe('system');
  },
  { families: ['shadcn'], locales: ['en'], timeout: 45_000 },
);

demoTest(
  'job application can use a light Shadcn form in an explicitly dark page',
  async ({ page, family, webcomponent, base }) => {
    await page.addInitScript(() => {
      localStorage.setItem('shadcn-example-mode', JSON.stringify({ version: 1, value: 'dark' }));
    });
    await page.goto(
      `${base}/${family}/#/examples/spec-job-application?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const firstName = page.getByRole('textbox', { name: 'First Name' });
    await expect.poll(() => firstName.count()).toBe(1);
    await expect.poll(() => page.locator('html').getAttribute('data-mode')).toBe('dark');

    await page.getByRole('button', { name: 'Toggle Theme' }).click();
    await expect
      .poll(() =>
        firstName.evaluate((input) => ({
          colorScheme: getComputedStyle(input).colorScheme,
          background: getComputedStyle(input).backgroundColor,
          foreground: getComputedStyle(input).color,
        })),
      )
      .toEqual({
        colorScheme: 'light',
        background: 'rgb(255, 255, 255)',
        foreground: 'rgb(2, 8, 23)',
      });
    await expect
      .poll(() =>
        page
          .getByText('First Name', { exact: true })
          .evaluate((label) => getComputedStyle(label).color),
      )
      .toBe('rgb(2, 8, 23)');
    await expect.poll(() => page.locator('html').getAttribute('data-mode')).toBe('dark');
  },
  { families: ['shadcn'], locales: ['en'], hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'job application can use a dark Shadcn form in a light page',
  async ({ page, family, webcomponent, base }) => {
    await page.addInitScript(() => {
      localStorage.setItem('shadcn-example-mode', JSON.stringify({ version: 1, value: 'light' }));
    });
    await page.goto(
      `${base}/${family}/#/examples/spec-job-application?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const firstName = page.getByRole('textbox', { name: 'First Name' });
    await expect.poll(() => firstName.count()).toBe(1);
    await expect.poll(() => page.locator('html').getAttribute('data-mode')).toBe('light');

    await page.getByRole('button', { name: 'Toggle Theme' }).click();
    await expect
      .poll(() =>
        firstName.evaluate((input) => ({
          colorScheme: getComputedStyle(input).colorScheme,
          background: getComputedStyle(input).backgroundColor,
          foreground: getComputedStyle(input).color,
        })),
      )
      .toEqual({
        colorScheme: 'dark',
        background: 'rgb(26, 26, 26)',
        foreground: 'rgb(250, 250, 250)',
      });
    await expect
      .poll(() =>
        page
          .getByText('First Name', { exact: true })
          .evaluate((label) => getComputedStyle(label).color),
      )
      .toBe('rgb(250, 250, 250)');
    await expect.poll(() => page.locator('html').getAttribute('data-mode')).toBe('light');
  },
  { families: ['shadcn'], locales: ['en'], hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'job application can use a light form with the Skeleton app explicitly dark',
  async ({ page, family, webcomponent, base }) => {
    await page.addInitScript(() => {
      localStorage.setItem('skeleton-example-mode', JSON.stringify({ version: 1, value: 'dark' }));
    });
    await page.goto(
      `${base}/${family}/#/examples/spec-job-application?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const firstName = page.getByRole('textbox', { name: 'First Name' });
    await expect.poll(() => firstName.count()).toBe(1);
    await expect.poll(() => page.locator('html').getAttribute('data-mode')).toBe('dark');

    await page.getByRole('button', { name: 'Toggle Theme' }).click();
    await expect
      .poll(() =>
        firstName.evaluate((input) => ({
          colorScheme: getComputedStyle(input).colorScheme,
          background: getComputedStyle(input).backgroundColor,
        })),
      )
      .toEqual({ colorScheme: 'light', background: 'oklch(0.99 0 0)' });
    await expect.poll(() => page.locator('html').getAttribute('data-mode')).toBe('dark');

    await page.getByRole('button', { name: 'Toggle Theme' }).click();
    await expect
      .poll(() =>
        firstName.evaluate((input) => ({
          colorScheme: getComputedStyle(input).colorScheme,
          background: getComputedStyle(input).backgroundColor,
        })),
      )
      .toEqual({ colorScheme: 'dark', background: 'oklch(0.18 0 0)' });
  },
  { families: ['skeleton'], locales: ['en'], hosts: ['native'], timeout: 45_000 },
);

demoTest(
  'job application can use a dark form with the Skeleton app explicitly light',
  async ({ page, family, webcomponent, base }) => {
    await page.addInitScript(() => {
      localStorage.setItem('skeleton-example-mode', JSON.stringify({ version: 1, value: 'light' }));
    });
    await page.goto(
      `${base}/${family}/#/examples/spec-job-application?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const firstName = page.getByRole('textbox', { name: 'First Name' });
    await expect.poll(() => firstName.count()).toBe(1);
    await expect.poll(() => page.locator('html').getAttribute('data-mode')).toBe('light');

    await page.getByRole('button', { name: 'Toggle Theme' }).click();
    await expect
      .poll(() =>
        firstName.evaluate((input) => ({
          colorScheme: getComputedStyle(input).colorScheme,
          background: getComputedStyle(input).backgroundColor,
          foreground: getComputedStyle(input).color,
        })),
      )
      .toEqual({
        colorScheme: 'dark',
        background: 'oklch(0.18 0 0)',
        foreground: 'oklch(0.99 0 0)',
      });
    await expect
      .poll(() =>
        page
          .getByText('First Name', { exact: true })
          .evaluate((label) => getComputedStyle(label).color),
      )
      .toBe('oklch(0.99 0 0)');
    await expect.poll(() => page.locator('html').getAttribute('data-mode')).toBe('light');

    await page.getByRole('button', { name: 'Toggle Theme' }).click();
    await expect
      .poll(() =>
        firstName.evaluate((input) => ({
          colorScheme: getComputedStyle(input).colorScheme,
          background: getComputedStyle(input).backgroundColor,
        })),
      )
      .toEqual({ colorScheme: 'light', background: 'oklch(0.99 0 0)' });
  },
  { families: ['skeleton'], locales: ['en'], hosts: ['native'], timeout: 45_000 },
);
