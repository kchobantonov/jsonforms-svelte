import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-layout-sizing/translations.json';

demoTest(
  'control-layout-sizing',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-layout-sizing?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const tab = (section: 1 | 2 | 3 | 4) =>
      page.getByRole('tab', {
        name: translations[locale][`featureNavigation.section${section}.label`],
        exact: true,
      });
    const row = () => page.locator('[data-layout="row"]:visible').first();
    const widths = () =>
      row()
        .locator('[data-layout-item]')
        .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().width));

    await tab(1).click();
    const span = await widths();
    expect(span).toHaveLength(3);
    expect(Math.abs(span[0] - span[2])).toBeLessThan(2);
    const rowWidth = await row().evaluate((node) => node.getBoundingClientRect().width);
    const column = (rowWidth - 15 * 16) / 16;
    expect(span[0]).toBeCloseTo(4 * column + 3 * 16, 0);
    expect(span[1]).toBeCloseTo(8 * column + 7 * 16, 0);

    await tab(2).click();
    const weighted = await widths();
    expect(weighted).toHaveLength(3);
    expect(Math.abs(weighted[0] - weighted[1])).toBeLessThan(2);
    expect(Math.abs(weighted[0] - 2 * weighted[2])).toBeLessThan(3);

    await tab(3).click();
    const fixed = await widths();
    expect(fixed[0]).toBeCloseTo(180, 0);
    expect(fixed[1]).toBeLessThanOrEqual(512);

    await tab(4).click();
    expect(await row().locator('[data-layout-item]').count()).toBe(1);
    await page.getByRole('checkbox').first().click();
    await expect.poll(() => row().locator('[data-layout-item]').count()).toBe(2);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);

demoTest(
  'control-layout-sizing conditional spans spacer and wrap',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-layout-sizing?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const tab = (section: 5 | 6 | 7) =>
      page.getByRole('tab', {
        name: translations[locale][`featureNavigation.section${section}.label`],
        exact: true,
      });
    const rows = page.locator('[data-layout="row"]:visible');
    const widths = (index: number) =>
      rows
        .nth(index)
        .locator('[data-layout-item]')
        .evaluateAll((items) => items.map((item) => item.getBoundingClientRect().width));

    await tab(7).click();
    await expect.poll(() => rows.count()).toBe(2);
    const spanBefore = await widths(0);
    const weightBefore = await widths(1);
    expect(spanBefore).toHaveLength(3);
    expect(weightBefore).toHaveLength(3);
    await page.getByRole('checkbox').first().click();
    await expect.poll(() => rows.nth(0).locator('[data-layout-item]').count()).toBe(2);
    await expect.poll(() => rows.nth(1).locator('[data-layout-item]').count()).toBe(2);
    const spanAfter = await widths(0);
    const weightAfter = await widths(1);
    expect(Math.abs(spanAfter[0] - spanBefore[0])).toBeLessThan(2);
    expect(Math.abs(spanAfter[1] - spanBefore[2])).toBeLessThan(2);
    expect(weightAfter[0]).toBeGreaterThan(weightBefore[0] * 1.5);
    expect(Math.abs(weightAfter[0] - weightAfter[1])).toBeLessThan(2);
    const bookedBy = page.locator('[id="#/properties/bookedBy-input"]:visible');
    await bookedBy.first().fill('A. Ferreira revised');
    await bookedBy.first().press('Tab');

    await tab(5).click();
    await expect.poll(() => rows.count()).toBe(1);
    const spacerWidths = await widths(0);
    expect(spacerWidths).toHaveLength(3);
    expect(spacerWidths[1]).toBeCloseTo(48, 0);
    await tab(7).click();
    await expect.poll(() => bookedBy.first().inputValue()).toBe('A. Ferreira revised');

    await page.setViewportSize({ width: 700, height: 900 });
    await tab(6).click();
    await expect.poll(() => rows.count()).toBe(1);
    const positions = await rows
      .first()
      .locator('[data-layout-item]')
      .evaluateAll((items) =>
        items.map((item) => ({
          top: item.getBoundingClientRect().top,
          width: item.getBoundingClientRect().width,
        })),
      );
    expect(positions).toHaveLength(4);
    expect(new Set(positions.map(({ top }) => Math.round(top))).size).toBeGreaterThan(1);
    expect(positions.every(({ width }) => width >= 224)).toBe(true);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);

demoTest(
  'control-layout-sizing fixed auto and nested presentation',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-layout-sizing?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const rows = page.locator('[data-layout="row"]:visible');
    const measure = (index: number) =>
      rows.nth(index).evaluate((row) => ({
        width: row.getBoundingClientRect().width,
        items: [...row.querySelectorAll<HTMLElement>(':scope > [data-layout-item]')].map(
          (item) => ({
            width: item.getBoundingClientRect().width,
            top: item.getBoundingClientRect().top,
          }),
        ),
      }));

    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section8.label'],
        exact: true,
      })
      .click();
    await expect.poll(() => rows.count()).toBe(6);
    const quarter = await measure(0);
    const quarterAuto = await measure(1);
    const quarterTwoAuto = await measure(2);
    const unusedHalf = await measure(3);
    const overflowing = await measure(4);
    const equalThirds = await measure(5);
    expect(quarter.items).toHaveLength(1);
    expect(quarter.items[0].width / quarter.width).toBeCloseTo(0.25, 1);
    expect(quarterAuto.items[0].width).toBeCloseTo(quarter.items[0].width, 0);
    expect(quarterAuto.items[1].width).toBeGreaterThan(quarterAuto.items[0].width * 2);
    expect(quarterTwoAuto.items[0].width).toBeCloseTo(quarter.items[0].width, 0);
    expect(Math.abs(quarterTwoAuto.items[1].width - quarterTwoAuto.items[2].width)).toBeLessThan(2);
    expect(unusedHalf.items).toHaveLength(2);
    expect(unusedHalf.items[0].width).toBeCloseTo(unusedHalf.items[1].width, 0);
    expect(unusedHalf.items[0].width + unusedHalf.items[1].width).toBeLessThan(
      unusedHalf.width * 0.55,
    );
    expect(overflowing.items).toHaveLength(3);
    expect(overflowing.items[1].top).toBeGreaterThan(overflowing.items[0].top);
    expect(Math.abs(overflowing.items[1].top - overflowing.items[2].top)).toBeLessThan(2);
    expect(equalThirds.items).toHaveLength(3);
    expect(Math.max(...equalThirds.items.map(({ width }) => width))).toBeLessThan(
      Math.min(...equalThirds.items.map(({ width }) => width)) + 2,
    );

    await page
      .getByRole('tab', { name: translations[locale]['nestedSizing.tab.label'], exact: true })
      .click();
    await expect.poll(() => rows.count()).toBe(1);
    const nested = await measure(0);
    expect(nested.items).toHaveLength(2);
    expect(nested.items[1].width).toBeGreaterThan(nested.items[0].width * 1.9);
    expect(
      await page
        .getByText(translations[locale]['nestedSizing.label.text'], { exact: true })
        .isVisible(),
    ).toBe(true);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
