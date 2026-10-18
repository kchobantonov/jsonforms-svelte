import { expect } from 'vitest';
import { mkdir } from 'node:fs/promises';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-choice-controls/translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest('choice-selects', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const catalog = translations[locale];
  const category = () =>
    page
      .getByRole('tab', { name: catalog['compositeChoices.navigation.label'], exact: true })
      .click();
  await category();
  const choice = page.locator('[id*="/properties/objectDropdown-input"]');
  const label = () =>
    choice.evaluate((element) =>
      element instanceof HTMLSelectElement
        ? element.selectedOptions[0]?.textContent
        : element instanceof HTMLInputElement
          ? element.value
          : element.textContent?.trim(),
    );
  await expect.poll(label).toBe(catalog['compositeChoices.option1.title']);
  const selectEmail = async () => {
    if (family === 'flowbite') {
      await choice.selectOption({ label: catalog['compositeChoices.option0.title'] });
    } else if (family === 'skeleton') {
      await choice.fill(catalog['compositeChoices.option0.title']);
      await choice.press('ArrowDown');
      await choice.press('Enter');
    } else {
      await choice.click();
      await page
        .getByRole('option', { name: catalog['compositeChoices.option0.title'], exact: true })
        .click();
    }
    await expect.poll(label).toBe(catalog['compositeChoices.option0.title']);
  };
  await selectEmail();
  await choice.focus();
  const container =
    family === 'flowbite' ? choice.locator('..').locator('..') : choice.locator('..');
  await container
    .getByRole('button', { name: messages[locale]['control.clearValue'], exact: true })
    .click();
  await expect
    .poll(label)
    .toBe(family === 'skeleton' ? '' : messages[locale]['control.selectOption']);
  if (family === 'flowbite') {
    expect(
      await choice.evaluate(
        (element) => (element.getRootNode() as Document | ShadowRoot).activeElement === element,
      ),
    ).toBe(true);
  }
  await selectEmail();

  await page
    .getByRole('tab', { name: catalog['featureNavigation.section5.label'], exact: true })
    .click();
  const origin = page.locator('[id*="/properties/origin-input"]').first();
  const handler = page.locator('[id*="/properties/handler-input"]').first();
  const searchInput = () =>
    (family === 'shadcn' ? page.locator('[data-slot=popover-content][data-state=open]') : page)
      .getByPlaceholder(messages[locale]['arrayChoices.search'], { exact: true })
      .filter({ visible: true });
  const searchChoice = async (trigger: typeof origin, query: string, result: string) => {
    if (family === 'skeleton') await trigger.fill(query);
    else {
      await trigger.click();
      await searchInput().fill(query);
    }
    await page
      .getByRole('option', { name: result, exact: true })
      .and(page.locator('[role=option]'))
      .click();
  };
  await searchChoice(origin, 'Seatt', 'Seattle');
  await searchChoice(handler, catalog['handler.fin'], catalog['handler.fin']);
  if (locale === 'en' && webcomponent) {
    await mkdir('test-results', { recursive: true });
    await page.setViewportSize({ width: 390, height: 900 });
    const form = page.locator(`jsonforms-svelte-${family}`);
    await expect
      .poll(() =>
        form.evaluate((element) => {
          const data = (element as HTMLElement & { data: string | { handler?: string } }).data;
          return (typeof data === 'string' ? JSON.parse(data) : data).handler;
        }),
      )
      .toBe('fin');
    for (const mode of ['light', 'dark']) {
      await form.evaluate((element, mode) => {
        (element as HTMLElement & { mode: string }).mode = mode;
      }, mode);
      await origin.scrollIntoViewIfNeeded();
      if (family === 'skeleton') await origin.fill('Se');
      else {
        await origin.click();
        await searchInput().fill('Se');
      }
      const result = page
        .getByRole('option', { name: 'Seattle', exact: true })
        .and(page.locator('[role=option]'));
      await result.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `test-results/search-choices-${family}-${mode}-narrow.png`,
        animations: 'disabled',
      });
      await page.keyboard.press('Escape');
    }
    await form.evaluate((element) => {
      (element as HTMLElement & { mode: string }).mode = 'light';
    });
    await page.setViewportSize({ width: 1440, height: 1000 });
  }

  const dataLabel = demoEditorLabel(locale, 'Data');
  await page.getByRole('tab', { name: dataLabel, exact: true }).click();
  const toolbar = page.getByRole('heading', { name: dataLabel, exact: true }).locator('..');
  await toolbar
    .locator('..')
    .locator('.monaco-editor')
    .click({ position: { x: 80, y: 20 } });
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  const readStored = async () => {
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.press('ControlOrMeta+C');
    return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
  };
  await expect
    .poll(async () => (await readStored()).objectDropdown)
    .toEqual({ mode: 'email', settings: { priority: 1 } });
  expect((await readStored()).origin).toBe('Seattle');
  expect((await readStored()).handler).toBe('fin');
  expect((await readStored()).objectRadio).toEqual({ mode: 'postal', settings: { priority: 2 } });
  await toolbar.getByRole('button').nth(1).click();
  await page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
  await category();
  await expect.poll(label).toBe(catalog['compositeChoices.option0.title']);
  expect(errors).toEqual([]);
});
