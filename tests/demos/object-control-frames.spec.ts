import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import translations from '@chobantonov/jsonforms-extended-spec/examples/object-control/translations.json';
import supplement from '@chobantonov/jsonforms-extended-spec/examples/object-control/translations.json';

demoTest('object-control-frames', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-object-control?use-webcomponent=${webcomponent}&drawer=false`,
  );

  for (const [kind, staticCount, dynamicCount] of [
    ['static', 2, 0],
    ['dynamic', 0, 2],
    ['mixed', 2, 2],
  ] as const) {
    const label = translations[locale][`objectFrame.${kind}.label`];
    await page.getByRole('tab', { name: label, exact: true }).click();
    const panel = page.getByRole('tabpanel', { name: label, exact: true });
    await expect.poll(() => panel.locator('[data-group-frame]').count()).toBe(2);
    await expect.poll(() => panel.locator('[data-object-static-fields]').count()).toBe(staticCount);
    const additional = panel.locator('[data-additional-properties]');
    await expect.poll(() => additional.count()).toBe(dynamicCount);
    for (const element of await additional.all()) {
      expect(await element.getAttribute('data-embedded')).toBe('true');
      expect(await element.evaluate((node) => getComputedStyle(node).borderTopWidth)).toBe('0px');
    }
    const groups = panel.locator('[data-group-frame]');
    const titled = groups.first();
    const untitled = groups.last();
    await expect.poll(() => titled.getAttribute('aria-label')).toBe(label);
    assert.equal(await untitled.getAttribute('aria-label'), null);
    assert.equal(await panel.locator('[data-object-boundary]').count(), 0);
  }

  const groupsLabel = translations[locale]['features.groups.label'];
  await page.getByRole('tab', { name: groupsLabel, exact: true }).click();
  const groupsPanel = page.getByRole('tabpanel', { name: groupsLabel, exact: true });
  const outer =
    supplement[locale]['specObjectControl.ui.elements.3.elements.1.options.detail.label'];
  const inner =
    supplement[locale][
      'specObjectControl.ui.elements.3.elements.1.options.detail.elements.0.label'
    ];
  await expect.poll(() => groupsPanel.locator('[data-group-frame]').count()).toBe(2);
  await expect
    .poll(() => groupsPanel.locator('[data-group-frame]').first().getAttribute('aria-label'))
    .toBe(outer);
  await expect
    .poll(() => groupsPanel.locator('[data-group-frame]').last().getAttribute('aria-label'))
    .toBe(inner);
  assert.equal(await groupsPanel.locator('[data-object-boundary]').count(), 0);
  assert.deepEqual(pageErrors, []);
});
