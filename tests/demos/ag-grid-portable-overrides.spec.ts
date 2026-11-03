import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-ag-grid/translations.supplement.json';

demoTest(
  'ag-grid-portable-overrides',
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
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const tab = (index: number) =>
      page.getByRole('tab', {
        name: translations[locale][
          `specAgGrid.ui.elements.${index}.label` as keyof typeof translations.en
        ],
        exact: true,
      });
    const panel = (index: number) =>
      page.getByRole('tabpanel', {
        name: translations[locale][
          `specAgGrid.ui.elements.${index}.label` as keyof typeof translations.en
        ],
        exact: true,
      });
    const gridRows = (index: number) => panel(index).locator('.ag-row[row-index]');

    await tab(0).click();
    await expect.poll(() => panel(0).locator('tbody tr').count()).toBe(3);
    await expect
      .poll(() => panel(0).locator('thead th').allTextContents())
      .toEqual(
        expect.arrayContaining([
          expect.stringContaining(
            translations[locale][
              'specAgGrid.schema.properties.applicants.items.properties.name.label'
            ],
          ),
          expect.stringContaining(
            translations[locale][
              'specAgGrid.schema.properties.applicants.items.properties.email.label'
            ],
          ),
        ]),
      );
    await tab(1).click();
    await expect.poll(() => gridRows(1).count()).toBe(3);
    await expect
      .poll(() => panel(1).locator('.ag-row[row-index="0"] [col-id="name"] input').inputValue())
      .toBe('Alex Rivera');
    const portableName = panel(1).locator('.ag-header-cell[col-id="name"]');
    const portableEmail = panel(1).locator('.ag-header-cell[col-id="email"]');
    await expect
      .poll(async () => [
        Math.round((await portableName.boundingBox())!.width),
        Math.round((await portableEmail.boundingBox())!.width),
      ])
      .toEqual([180, 220]);
    expect((await portableName.boundingBox())!.x).toBeLessThan(
      (await portableEmail.boundingBox())!.x,
    );

    await tab(2).click();
    await expect.poll(() => gridRows(2).count()).toBe(3);
    await tab(3).click();
    await expect.poll(() => gridRows(3).count()).toBe(3);
    await tab(4).click();
    await expect.poll(() => gridRows(4).count()).toBe(6);
    await tab(5).click();
    await expect.poll(() => gridRows(5).count()).toBe(2);
    await expect
      .poll(() =>
        panel(5).locator('.ag-row[row-index="0"] [col-id="experience"] input').inputValue(),
      )
      .toBe('8');
    await expect
      .poll(() => panel(5).locator('.ag-header').textContent())
      .toContain(
        translations[locale][
          'specAgGrid.ui.elements.5.elements.1.options.agGridOptions.columnDefs.0.headerName'
        ],
      );
    const nativeName = panel(5).locator('.ag-header-cell[col-id="name"]');
    const nativeEmail = panel(5).locator('.ag-header-cell[col-id="email"]');
    await expect
      .poll(async () => [
        Math.round((await nativeName.boundingBox())!.width),
        Math.round((await nativeEmail.boundingBox())!.width),
      ])
      .toEqual([190, 260]);
    expect((await nativeEmail.boundingBox())!.x).toBeLessThan((await nativeName.boundingBox())!.x);
    await tab(6).click();
    await expect.poll(() => gridRows(6).count()).toBe(12);
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
