import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import original from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/data.json';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.json';
import supplemental from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-controls/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('array-controls-bounds', async ({ page, family, locale, webcomponent, base }) => {
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
    `${base}/${family}/#/examples/spec-array-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );

  const category = translations[locale]['boundsTab.label'];
  await page.getByRole('tab', { name: category, exact: true }).click();
  const panel = page.getByRole('tabpanel', { name: category, exact: true });
  const card = (title: string) =>
    panel
      .getByRole('heading', { name: title, exact: true })
      .locator('..')
      .locator('..')
      .locator('..');
  const roundsLabel = supplemental[locale]['specArrayControls.schema.properties.rounds.label'];
  const checklistLabel =
    supplemental[locale]['specArrayControls.schema.properties.checklist.label'];
  const reviewersLabel =
    supplemental[locale]['specArrayControls.schema.properties.reviewers.label'];
  const rounds = card(roundsLabel);
  const checklist = card(checklistLabel);
  const reviewers = card(reviewersLabel);
  const add = rounds.getByRole('button', {
    name: messages[locale]['array.addAriaLabelWithLabel'].replace('{label}', roundsLabel),
    exact: true,
  });
  const roundRemoves = rounds.getByRole('button', {
    name: messages[locale]['array.removeAriaLabel'],
    exact: true,
  });

  await expect.poll(() => add.isEnabled()).toBe(true);
  if (family === 'flowbite') {
    await add.hover();
    const tooltip = page.locator('[role="tooltip"]:visible').filter({ hasText: /./ }).first();
    await tooltip.waitFor();
    expect(await tooltip.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(await tooltip.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
  }
  await expect.poll(() => roundRemoves.count()).toBe(1);
  await expect.poll(() => roundRemoves.first().isDisabled()).toBe(true);
  await roundRemoves
    .first()
    .evaluate((button) => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await expect.poll(() => roundRemoves.count()).toBe(1);
  await add.click();
  await expect.poll(() => roundRemoves.count()).toBe(2);
  await add.click();
  await expect.poll(() => roundRemoves.count()).toBe(3);
  await expect.poll(() => add.isDisabled()).toBe(true);
  await add.evaluate((button) => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await expect.poll(() => roundRemoves.count()).toBe(3);
  await expect
    .poll(() =>
      checklist
        .getByRole('button', {
          name: messages[locale]['array.addAriaLabelWithLabel'].replace('{label}', checklistLabel),
          exact: true,
        })
        .isDisabled(),
    )
    .toBe(true);
  await checklist
    .getByRole('button', {
      name: messages[locale]['array.addAriaLabelWithLabel'].replace('{label}', checklistLabel),
      exact: true,
    })
    .evaluate((button) => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await expect
    .poll(() =>
      checklist
        .getByRole('button', {
          name: messages[locale]['collection.deleteSelected'],
          exact: true,
        })
        .isDisabled(),
    )
    .toBe(true);
  await checklist
    .getByRole('button', {
      name: messages[locale]['collection.deleteSelected'],
      exact: true,
    })
    .evaluate((button) => button.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await expect.poll(() => checklist.getByRole('textbox').first().isEnabled()).toBe(true);
  await expect
    .poll(() =>
      panel.getByText(translations[locale]['arrayControls.reviewers.error.contains']).count(),
    )
    .toBeGreaterThan(0);
  await expect.poll(() => reviewers.locator('[data-row-summary]').count()).toBe(0);
  await expect.poll(() => reviewers.locator('[aria-invalid="true"]').count()).toBe(0);

  await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await expect
    .poll(async () => {
      await page
        .locator('.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context')
        .focus();
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      const data = JSON.parse(
        await page.evaluate(() => navigator.clipboard.readText()),
      ) as typeof original;
      return { rounds: data.rounds, checklist: data.checklist };
    })
    .toEqual({
      rounds: [...original.rounds, { active: true }, { active: true }],
      checklist: original.checklist,
    });
  expect(pageErrors).toEqual([]);
});
