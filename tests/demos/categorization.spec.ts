import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-categorization/translations.json';
import supplement from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-categorization/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'categorization',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-categorization?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: false,
      })
      .click();
    const planning = page.getByRole('button', {
      name: translations[locale]['category.planning.label'],
      exact: false,
    });
    await expect.poll(() => planning.getAttribute('aria-expanded')).toBe('true');
    const marker = planning.locator('[data-container-validation-indicator]');
    expect(await marker.getAttribute('aria-label')).toBe(
      messages[locale]['validation.containerHasErrors'],
    );
    const headerBounds = await planning.boundingBox();
    const indicatorBounds = await marker.boundingBox();
    expect(headerBounds).not.toBeNull();
    expect(indicatorBounds).not.toBeNull();
    expect(indicatorBounds!.x).toBeGreaterThan(headerBounds!.x + headerBounds!.width * 0.7);
    const summary = page.locator('[data-error-summary]:visible');
    await marker.hover();
    await expect.poll(() => summary.isVisible()).toBe(true);
    await page.mouse.move(0, 0);
    await expect.poll(() => summary.count()).toBe(0);
    await marker.click();
    await expect.poll(() => summary.isVisible()).toBe(true);
    expect(await summary.locator('li').count()).toBeGreaterThan(0);
    expect(await planning.getAttribute('aria-expanded')).toBe('true');
    await page.keyboard.press('Escape');
    await expect.poll(() => summary.count()).toBe(0);
    await page
      .getByRole('spinbutton', {
        name: supplement[locale]['specCategorization.schema.properties.itemCount.label'],
        exact: true,
      })
      .fill('4');
    await expect.poll(() => marker.count()).toBe(0);
    await planning.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => planning.getAttribute('aria-expanded')).toBe('false');
    const contact = page.getByRole('button', {
      name: translations[locale]['category.contact.label'],
      exact: false,
    });
    await contact.focus();
    await page.keyboard.press('Space');
    await expect.poll(() => contact.getAttribute('aria-expanded')).toBe('true');
    expect(await planning.getAttribute('aria-expanded')).toBe('false');
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section2.label'],
        exact: false,
      })
      .click();
    const next = page.getByRole('button', {
      name: translations[locale]['categorization.next'],
      exact: false,
    });
    const contactName = page.getByRole('textbox', {
      name: supplement[locale]['specCategorization.schema.properties.contactName.label'],
      exact: true,
    });
    await contactName.evaluate((input: HTMLInputElement) => {
      input.value = 'Grace';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    await next.evaluate((button: HTMLButtonElement) => button.click());
    const previous = page.getByRole('button', {
      name: translations[locale]['categorization.previous'],
      exact: false,
    });
    await expect.poll(() => previous.isEnabled()).toBe(true);
    await previous.click();
    await expect.poll(() => contactName.inputValue()).toBe('Grace');
    expect(errors).toEqual([]);
  },
  { timeout: 20000 },
);

demoTest(
  'categorization category visibility',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-categorization?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const business = page.getByRole('checkbox', {
      name: supplement[locale]['specCategorization.schema.properties.isBusiness.label'],
    });
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section1.label'],
        exact: false,
      })
      .click();
    const businessTab = page.getByRole('tab', {
      name: translations[locale]['category.business.label'],
      exact: false,
    });
    await expect.poll(() => businessTab.count()).toBe(0);
    await business.check();
    await expect.poll(() => businessTab.count()).toBe(1);
    await businessTab.click();
    await expect.poll(() => businessTab.getAttribute('aria-selected')).toBe('true');
    await businessTab.focus();
    await business.evaluate((control: HTMLElement) => control.click());
    await expect.poll(() => businessTab.count()).toBe(0);
    const contactTab = page.getByRole('tab', {
      name: translations[locale]['category.contact.label'],
      exact: false,
    });
    await expect.poll(() => contactTab.getAttribute('aria-selected')).toBe('true');
    await expect
      .poll(() =>
        contactTab.evaluate(
          (tab) => (tab.getRootNode() as Document | ShadowRoot).activeElement === tab,
        ),
      )
      .toBe(true);

    await business.check();
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section2.label'],
        exact: false,
      })
      .click();
    const businessStep = page
      .getByRole('button', {
        name: translations[locale]['category.business.label'],
        exact: false,
      })
      .or(
        page.getByRole('tab', {
          name: translations[locale]['category.business.label'],
          exact: false,
        }),
      );
    await businessStep.click();
    await businessStep.focus();
    await business.evaluate((control: HTMLElement) => control.click());
    await expect.poll(() => businessStep.count()).toBe(0);
    const contactStep = page
      .getByRole('button', {
        name: translations[locale]['category.contact.label'],
        exact: false,
      })
      .or(
        page.getByRole('tab', {
          name: translations[locale]['category.contact.label'],
          exact: false,
        }),
      );
    await expect
      .poll(() =>
        contactStep.evaluate(
          (step) => (step.getRootNode() as Document | ShadowRoot).activeElement === step,
        ),
      )
      .toBe(true);

    await business.check();
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: false,
      })
      .click();
    const businessHeader = page.getByRole('button', {
      name: translations[locale]['category.business.label'],
      exact: false,
    });
    await businessHeader.click();
    await businessHeader.focus();
    await business.evaluate((control: HTMLElement) => control.click());
    await expect.poll(() => businessHeader.count()).toBe(0);
    const contactHeader = page.getByRole('button', {
      name: translations[locale]['category.contact.label'],
      exact: false,
    });
    await expect
      .poll(() =>
        contactHeader.evaluate(
          (header) => (header.getRootNode() as Document | ShadowRoot).activeElement === header,
        ),
      )
      .toBe(true);
    expect(errors).toEqual([]);
  },
  { timeout: 20000 },
);

demoTest(
  'categorization tab pending draft',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-categorization?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section1.label'],
        exact: false,
      })
      .click();
    const contactName = page.getByRole('textbox', {
      name: supplement[locale]['specCategorization.schema.properties.contactName.label'],
      exact: true,
    });
    await contactName.evaluate((input: HTMLInputElement) => {
      input.value = 'Grace';
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });
    const planning = page.getByRole('tab', {
      name: translations[locale]['category.planning.label'],
      exact: false,
    });
    await planning.evaluate((button: HTMLButtonElement) => button.click());
    await expect.poll(() => planning.getAttribute('aria-selected')).toBe('true');
    const contact = page.getByRole('tab', {
      name: translations[locale]['category.contact.label'],
      exact: false,
    });
    await contact.evaluate((button: HTMLButtonElement) => button.click());
    await expect.poll(() => contactName.inputValue()).toBe('Grace');
    expect(errors).toEqual([]);
  },
  { timeout: 20000 },
);

demoTest(
  'categorization accordion closed selection',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-categorization?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: false,
      })
      .click();
    const planning = page.getByRole('button', {
      name: translations[locale]['category.planning.label'],
      exact: false,
    });
    await expect.poll(() => planning.getAttribute('aria-expanded')).toBe('true');
    await planning.click();
    await expect.poll(() => planning.getAttribute('aria-expanded')).toBe('false');
    const business = page.getByRole('checkbox', {
      name: supplement[locale]['specCategorization.schema.properties.isBusiness.label'],
    });
    await business.check();
    const businessHeader = page.getByRole('button', {
      name: translations[locale]['category.business.label'],
      exact: false,
    });
    await expect.poll(() => businessHeader.getAttribute('aria-expanded')).toBe('false');
    await business.uncheck();
    await expect.poll(() => businessHeader.count()).toBe(0);
    await expect.poll(() => planning.getAttribute('aria-expanded')).toBe('false');
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);
