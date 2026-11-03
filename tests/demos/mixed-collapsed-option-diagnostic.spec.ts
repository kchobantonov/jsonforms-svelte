import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import sourceUi from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/uischema.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/translations.json';

type CollapsedWarning = [string, { details?: { component?: string; source?: string } }];

demoTest(
  'mixed-collapsed-option-diagnostic',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const errors: string[] = [];
    const warnings: Promise<CollapsedWarning>[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('section.invalidCollapsed')) {
        warnings.push(
          Promise.all(
            message.args().map((argument) => argument.jsonValue()),
          ) as Promise<CollapsedWarning>,
        );
      }
    });
    await page.goto(
      `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: true,
      })
      .click();

    const structuredPanel = page.getByRole('tabpanel', {
      name: translations[locale]['featureNavigation.section3.label'],
      exact: true,
    });
    const nested = structuredPanel.locator('[data-mixed-collapse]').first();
    await expect.poll(() => nested.getAttribute('aria-expanded')).toBe('true');

    const invalidUi = structuredClone(sourceUi);
    const mixedControl = invalidUi.elements[0].elements[2].elements[1] as unknown as {
      options: Record<string, unknown>;
    };
    Object.assign(mixedControl.options, { collapsed: 'invalid' });
    await applyDemoEditor(page, locale, 'UI Schema', invalidUi, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: true,
      })
      .click();
    await expect
      .poll(async () =>
        (await Promise.all(warnings)).some(
          ([code, payload]) =>
            code === 'section.invalidCollapsed' &&
            payload.details?.component === 'mixed' &&
            payload.details?.source === 'options.collapsed',
        ),
      )
      .toBe(true);

    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { mixed: { collapsed: false } },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: true,
      })
      .click();
    await expect.poll(() => nested.getAttribute('aria-expanded')).toBe('true');
    await applyDemoEditor(page, locale, 'Config', {
      jsonformsExtended: { mixed: { collapsed: true } },
    });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: true,
      })
      .click();
    await expect.poll(() => nested.getAttribute('aria-expanded')).toBe('false');
    expect(errors).toEqual([]);
  },
  { timeout: 15_000 },
);
