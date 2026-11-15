import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/translations.json';
import sourceData from '@chobantonov/jsonforms-extended-spec/examples/tuple-control/data.json';

demoTest(
  'tuple complex summaries',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-tuple-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: true,
      })
      .click();

    const heading = supplement[locale]['tupleExample.schema.properties.handoffContacts.label'];
    const tuple = page
      .locator('[data-tuple-control]')
      .filter({ has: page.getByRole('heading', { name: heading, exact: true }) });
    const summaries = tuple.locator('.tuple-summary');
    await expect.poll(() => summaries.count()).toBe(4);
    await expect.poll(() => summaries.nth(0).textContent()).toBe('A. Ferreira');
    for (const index of [1, 2, 3]) {
      expect(await summaries.nth(index).textContent()).toBe(
        translations[locale]['composite.summary.details'],
      );
    }
    await summaries.first().click();
    expect(await page.locator('[data-composite-detail-dialog]').count()).toBe(0);

    for (const [index, expected] of [
      [0, 'Support'],
      [1, 'Yard'],
      [2, 'Gate'],
      [3, 'Night'],
    ] as const) {
      const label =
        supplement[locale][`tupleExample.schema.properties.handoffContacts.items.${index}.label`];
      await tuple
        .getByRole('button', {
          name: translations[locale]['composite.edit'].replace('{label}', label),
          exact: true,
        })
        .click();
      await expect
        .poll(() =>
          page
            .locator('[data-composite-detail-dialog] input')
            .evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
        )
        .toContain(expected);
      await page
        .locator('[data-detail-dialog-footer]')
        .getByRole('button', { name: /^(Cancel|Отказ)$/ })
        .click();
      await expect.poll(() => page.locator('[data-composite-detail-dialog]').count()).toBe(0);
    }

    const projectHeading =
      supplement[locale]['tupleExample.schema.properties.projectContact.label'];
    const project = page
      .locator('[data-tuple-control]')
      .filter({ has: page.getByRole('heading', { name: projectHeading, exact: true }) });
    const phoneSummary = project.locator('.tuple-summary').nth(1);
    await expect.poll(() => phoneSummary.textContent()).toBe('+1 503 555 0142');
    const showDemo = async () => {
      await page.getByRole('tab', { name: demoEditorLabel(locale, 'Demo') }).click();
      await page
        .getByRole('tab', {
          name: translations[locale]['featureNavigation.section3.label'],
          exact: true,
        })
        .click();
    };

    await applyDemoEditor(
      page,
      locale,
      'Data',
      {
        ...sourceData,
        projectContact: [sourceData.projectContact[0], ['111', '222', '333']],
      },
      { verifyVisibleText: false },
    );
    await showDemo();
    await expect
      .poll(() => phoneSummary.textContent())
      .toBe(`111, 222 ${translations[locale]['composite.summary.more'].replace('{count}', '1')}`);
    await applyDemoEditor(
      page,
      locale,
      'Data',
      {
        ...sourceData,
        projectContact: [sourceData.projectContact[0], []],
      },
      { verifyVisibleText: false },
    );
    await showDemo();
    await expect
      .poll(() => phoneSummary.textContent())
      .toBe(translations[locale]['composite.summary.items'].replace('{count}', '0'));
    await applyDemoEditor(
      page,
      locale,
      'Data',
      {
        ...sourceData,
        projectContact: [sourceData.projectContact[0]],
      },
      { verifyVisibleText: false },
    );
    await showDemo();
    await expect
      .poll(() => phoneSummary.textContent())
      .toBe(translations[locale]['composite.summary.unset']);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 20_000 },
);
