import { mkdir } from 'node:fs/promises';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import catalog from '@chobantonov/jsonforms-extended-spec/examples/combinators/translations.json';

demoTest('composition-presentation', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-combinators?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const labels = catalog[locale];
  const allOfTab = page.getByRole('tab', { name: 'allOf', exact: true });
  const waitForShadcnSelectedStyle = async (active: typeof allOfTab, inactive: typeof allOfTab) => {
    if (family !== 'shadcn') return;
    await expect
      .poll(
        async () => {
          const activeColor = await active.evaluate((tab) => getComputedStyle(tab).backgroundColor);
          const inactiveColor = await inactive.evaluate(
            (tab) => getComputedStyle(tab).backgroundColor,
          );
          return activeColor !== inactiveColor;
        },
        { timeout: 5_000 },
      )
      .toBe(true);
  };
  await allOfTab.click();
  await expect.poll(() => allOfTab.getAttribute('aria-selected')).toBe('true');
  await waitForShadcnSelectedStyle(allOfTab, page.getByRole('tab', { name: 'oneOf', exact: true }));
  const waitForSkeletonIndicator = async (tab: typeof allOfTab) => {
    if (family !== 'skeleton' || webcomponent) return;
    const indicator = tab.locator('..').locator('[data-part="indicator"]');
    await expect
      .poll(async () => {
        const tabBox = await tab.boundingBox();
        const indicatorBox = await indicator.boundingBox();
        return !!tabBox && !!indicatorBox && Math.abs(tabBox.x - indicatorBox.x) < 4;
      })
      .toBe(true);
  };
  const waitForTabPaint = async (tab: typeof allOfTab) => {
    if (family !== 'shadcn') return;
    await expect
      .poll(() =>
        tab.evaluate((node) =>
          node.getAnimations().some((animation) => animation.playState === 'running'),
        ),
      )
      .toBe(false);
    await page.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        ),
    );
  };
  await waitForSkeletonIndicator(allOfTab);
  const inputs = page.locator('input:visible');
  await expect
    .poll(() =>
      inputs.evaluateAll((nodes) =>
        nodes
          .map((node) => (node as HTMLInputElement).value)
          .filter((value) => value === 'Projector' || value === 'AB1234')
          .sort(),
      ),
    )
    .toEqual(['AB1234', 'Projector']);
  await expect.poll(() => page.getByRole('checkbox', { checked: true }).count()).toBe(1);
  for (const key of [
    'specCombinators.schema/properties/equipment/properties/name.label',
    'specCombinators.schema/properties/equipment/allOf/0/properties/assetTag.label',
    'specCombinators.schema/properties/equipment/allOf/1/properties/working.label',
  ] as const) {
    await expect.poll(() => page.getByText(labels[key], { exact: true }).count()).toBe(1);
  }
  if (!webcomponent) {
    await waitForTabPaint(allOfTab);
    await mkdir('test-results', { recursive: true });
    await page.screenshot({
      path: `test-results/composition-allof-${family}-${locale}.png`,
      fullPage: true,
    });
  }
  const scalarTab = page.getByRole('tab', {
    name: labels['specCombinators.ui/elements/1/elements/3.label'],
    exact: true,
  });
  await scalarTab.click();
  await expect.poll(() => scalarTab.getAttribute('aria-selected')).toBe('true');
  await waitForShadcnSelectedStyle(scalarTab, allOfTab);
  await waitForSkeletonIndicator(scalarTab);
  const attendees = page.getByLabel(labels['specCombinators.schema/properties/attendees.label'], {
    exact: true,
  });
  const seats = page.getByLabel(labels['specCombinators.schema/properties/seatsPerTable.label'], {
    exact: true,
  });
  await expect.poll(() => attendees.count()).toBe(1);
  await expect.poll(() => seats.count()).toBe(1);
  expect(await attendees.inputValue()).toBe('8');
  expect(await seats.inputValue()).toBe('6');
  for (const input of [attendees, seats]) {
    expect(await input.getAttribute('min')).toBeNull();
    expect(await input.getAttribute('max')).toBeNull();
  }
  if (!webcomponent) {
    await waitForTabPaint(scalarTab);
    await page.screenshot({
      path: `test-results/composition-scalar-${family}-${locale}.png`,
      fullPage: true,
    });
  }
  await attendees.fill('30');
  await seats.fill('15');
  await seats.press('Tab');
  await expect.poll(() => attendees.getAttribute('aria-invalid')).toBe('true');
  await expect.poll(() => seats.getAttribute('aria-invalid')).toBe('true');
  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const editor = page.locator(
    '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
  );
  await editor.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('ControlOrMeta+C');
  await expect
    .poll(async () => {
      const data = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      return [data.attendees, data.seatsPerTable];
    })
    .toEqual([30, 15]);
  expect(errors).toEqual([]);
});
