import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/translations.json';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-mixed-control/data.json';

demoTest('mixed-imported-invalid-type', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-mixed-control?use-webcomponent=${webcomponent}&drawer=false`,
  );
  await page
    .getByRole('tab', {
      name: translations[locale]['featureNavigation.section2.label'],
      exact: true,
    })
    .click();
  const field = page.locator('[id="#/properties/priority"]');
  await expect.poll(() => field.count()).toBe(1);
  const selector =
    family === 'shadcn'
      ? field.locator('[data-slot="select-trigger"]')
      : family === 'flowbite'
        ? field.locator('select').first()
        : field.locator('[role="combobox"]').first();
  await expect.poll(() => selector.getAttribute('aria-invalid')).toBe('true');
  await expect.poll(() => selector.innerText()).not.toContain('boolean');
  await expect
    .poll(() => field.locator('input[type="text"]').count())
    .toBe(family === 'skeleton' ? 1 : 0);

  const readData = async () => {
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const dataEditor = page.locator('.monaco-editor:visible');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await dataEditor.locator('.inputarea, .native-edit-context').focus();
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  };
  if (family === 'flowbite') {
    await selector.selectOption({ label: 'string' });
  } else {
    await (family === 'shadcn' ? selector : field.locator('[data-part="trigger"]').first()).click();
    if (family === 'skeleton') {
      const contentId = await selector.getAttribute('aria-controls');
      await page.locator(`[id="${contentId}"] [data-part="item"][data-value="0"]`).click();
    } else {
      await page.getByRole('option', { name: 'string', exact: true }).click();
    }
  }
  if (family === 'skeleton') {
    await expect.poll(() => selector.getAttribute('aria-invalid')).not.toBe('true');
  } else {
    await expect.poll(() => selector.getAttribute('aria-invalid')).toBe('false');
  }
  await expect.poll(readData).toEqual({ ...original, priority: '' });
  expect(errors).toEqual([]);
});
