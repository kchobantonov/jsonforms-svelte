import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import { applyDemoEditor } from '../helpers/demo-editor';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/tuple-draft-2020/translations.json';

demoTest(
  'tuple-draft-2020',
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
      `${base}/${family}/#/examples/tuple-draft-2020?use-webcomponent=${webcomponent}&drawer=false`,
    );

    const tuples = page.locator('[data-tuple-control]');
    await expect.poll(() => tuples.count()).toBe(2);
    const tuple = tuples.first();
    const survey = tuples.nth(1);
    const omitted = survey.locator('[data-tuple-omitted-errors]');
    await expect.poll(() => omitted.count()).toBe(1);
    await expect
      .poll(() => omitted.textContent())
      .toContain(translations[locale]['tuple2020.longitude.label']);
    await expect.poll(() => survey.getByRole('spinbutton').count()).toBe(2);
    await expect.poll(() => tuple.locator('[data-additional-item="2"]').count()).toBe(1);
    await expect.poll(() => tuple.locator('[data-additional-items-errors]').count()).toBe(1);
    await expect
      .poll(() => tuple.locator('.additional-items header').getByRole('button').last().isDisabled())
      .toBe(true);
    await tuple.locator('[data-additional-item="2"] .additional-item-actions button').click();
    await expect.poll(() => tuple.locator('[data-additional-item]').count()).toBe(0);
    await expect.poll(() => tuple.locator('[data-additional-items-errors]').count()).toBe(0);
    await expect.poll(() => tuple.getByRole('spinbutton').count()).toBe(2);
    const positions = tuple.getByRole('spinbutton');
    expect(await positions.nth(0).inputValue()).toBe('2');
    expect(await positions.nth(1).inputValue()).toBe('1');
    await positions.nth(0).fill('9');
    expect(await positions.nth(1).inputValue()).toBe('1');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await expect
      .poll(async () =>
        (await page.locator('.view-lines').allTextContents()).some((text) =>
          text.replace(/\s/g, '').includes('"coordinates":[1,9]'),
        ),
      )
      .toBe(true);
    await applyDemoEditor(page, locale, 'Data', {
      coordinates: [1, 9],
      survey: [45, 22, 3],
    });
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Demo') }).click();
    await expect.poll(() => survey.locator('[data-tuple-omitted-errors]').count()).toBe(0);
    expect(pageErrors).toEqual([]);
  },
  { timeout: 30_000 },
);
