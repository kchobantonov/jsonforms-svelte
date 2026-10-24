import { demoEditorLabel } from '../helpers/demo-labels';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';

demoTest('shell-localization', async ({ page, family, locale, webcomponent, base }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(
    ({ family, locale }) => {
      const key = `${family}-example-locale`;
      if (!localStorage.getItem(key)) localStorage.setItem(key, locale);
    },
    { family, locale },
  );
  await page.goto(
    `${base}/${family}/#/examples/spec-presentation?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const initial = messages[locale];
  const button = (name: string) =>
    page.getByRole('button', { name, exact: true, includeHidden: true });
  await button(initial['nav.showExamples']).click();
  const search = page.getByRole('textbox', { name: initial['sidebar.search'], exact: true });
  await search.fill('no-such-example-4857');
  await expect
    .poll(() => page.getByText(initial['sidebar.empty'], { exact: true }).isVisible())
    .toBe(true);
  await search.fill('');
  await button(initial['nav.hideExamples']).click();
  const themeKey =
    family === 'flowbite'
      ? 'nav.themeColor'
      : family === 'shadcn'
        ? 'theme.customize'
        : 'settings.theme';
  await button(initial[themeKey]).click();
  if (family === 'shadcn') {
    await page.getByRole('button', { name: initial['theme.baseColor'], exact: true }).click();
    await page.getByRole('option', { name: initial['theme.option.Stone'], exact: true }).click();
    await expect
      .poll(() =>
        page.getByRole('button', { name: initial['theme.baseColor'], exact: true }).textContent(),
      )
      .toContain(initial['theme.option.Stone']);
  } else if (family === 'skeleton') {
    await expect
      .poll(() =>
        page.getByRole('link', { name: initial['theme.create'], exact: true }).isVisible(),
      )
      .toBe(true);
  } else {
    await expect
      .poll(() => page.getByText(initial['theme.ocean'], { exact: true }).isVisible())
      .toBe(true);
  }
  if (family === 'skeleton') {
    await button(initial[themeKey]).click();
    await expect
      .poll(() =>
        page.getByRole('link', { name: initial['theme.create'], exact: true }).isVisible(),
      )
      .toBe(false);
  } else {
    await page.keyboard.press('Escape');
  }
  await expect
    .poll(() => button(initial[webcomponent ? 'nav.webComponent' : 'nav.svelte']).isVisible())
    .toBe(true);
  {
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Config'), exact: true }).click();
    const input = page
      .getByRole('heading', { name: demoEditorLabel(locale, 'Config'), exact: true })
      .locator('../..')
      .locator('.inputarea, .native-edit-context');
    await input.focus();
    await page.keyboard.press('ControlOrMeta+A');
    await input.evaluate((element) => {
      const clipboardData = new DataTransfer();
      clipboardData.setData(
        'text/plain',
        JSON.stringify({
          filterErrorKeywordsBeforeTouch: ['duplicateKeyword', 'duplicateKeyword'],
        }),
      );
      element.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
      );
    });
    await button(initial['editor.config.apply']).click();
  }
  await button(initial['nav.openSettings']).click();

  // Change the persisted demo locale through the native settings control. The
  // surrounding navigation must update without a page reload in both hosts.
  const nextLocale = locale === 'en' ? 'bg' : 'en';
  if (family === 'shadcn') {
    await page.locator('#locale').click();
    await page
      .getByRole('option', {
        name: initial[nextLocale === 'bg' ? 'settings.bulgarian' : 'settings.english'],
        exact: true,
      })
      .click();
  } else {
    await page.locator('#locale').selectOption(nextLocale);
  }
  const next = messages[nextLocale];
  await expect
    .poll(() => page.getByText(next['settings.title'], { exact: true }).isVisible())
    .toBe(true);
  await expect
    .poll(() => page.getByText(next['settings.hideRequired'], { exact: true }).isVisible())
    .toBe(true);
  await expect.poll(() => button(next['nav.showExamples']).count()).toBe(1);
  await expect
    .poll(() =>
      page
        .getByRole('link', { name: next['spec.source'], exact: true, includeHidden: true })
        .count(),
    )
    .toBe(1);
  expect(await page.evaluate((key) => localStorage.getItem(key), `${family}-example-locale`)).toBe(
    nextLocale,
  );
  const settingsSurface =
    family === 'skeleton'
      ? page
          .locator('aside')
          .filter({ has: page.getByText(next['settings.title'], { exact: true }) })
      : page.getByRole('dialog');
  {
    const duplicates = settingsSurface.getByRole('button', {
      name: next['settings.removeKeyword'].replace('{keyword}', 'duplicateKeyword'),
      exact: true,
    });
    await expect.poll(() => duplicates.count()).toBe(2);
    await duplicates.first().click();
    await expect.poll(() => duplicates.count()).toBe(1);
    await duplicates.click();
  }
  const keywords = settingsSurface.getByRole('textbox', {
    name: next['settings.keywords'],
    exact: true,
  });
  await keywords.fill('testKeyword');
  await keywords.press('Enter');
  const removeKeyword = settingsSurface.getByRole('button', {
    name: next['settings.removeKeyword'].replace('{keyword}', 'testKeyword'),
    exact: true,
  });
  await expect.poll(() => removeKeyword.count()).toBe(1);
  if (family === 'skeleton') {
    await expect
      .poll(async () => (await page.locator('[aria-live]').allTextContents()).join(' '))
      .toContain(next['settings.keyword.added'].replace('{keyword}', 'testKeyword'));
  }
  await keywords.fill('testKeyword');
  await keywords.press('Enter');
  await expect.poll(() => removeKeyword.count()).toBe(1);
  // Clear a rejected native duplicate draft before removing the existing item.
  await keywords.fill('');
  if (family === 'flowbite') {
    await keywords.press('Backspace');
    await expect.poll(() => keywords.inputValue()).toBe('testKeyword');
    await expect.poll(() => removeKeyword.count()).toBe(0);
    await keywords.press('Enter');
    await expect.poll(() => removeKeyword.count()).toBe(1);
  }
  await removeKeyword.click();
  await expect.poll(() => removeKeyword.count()).toBe(0);
  await expect.poll(() => settingsSurface.isVisible()).toBe(true);
  if (family === 'skeleton') {
    await expect
      .poll(async () => (await page.locator('[aria-live]').allTextContents()).join(' '))
      .toContain(next['settings.keyword.deleted'].replace('{keyword}', 'testKeyword'));
  }
  await settingsSurface
    .getByRole('button', { name: next['nav.closeSettings'], exact: true })
    .click();
  await expect.poll(() => button(next['nav.openSettings']).isVisible()).toBe(true);

  // Exercise editor messages in the selected locale using the rebuilt demo.
  await page.goto(
    `${base}/${family}/#/examples/spec-presentation?use-webcomponent=${webcomponent}&drawer=false`,
  );
  for (const editor of ['Schema', 'UI Schema', 'UI Schemas', 'Internationalization', 'Data']) {
    const name = demoEditorLabel(nextLocale, editor);
    await page.getByRole('tab', { name, exact: true }).click();
    await expect
      .poll(() => page.getByRole('heading', { name, exact: true }).isVisible())
      .toBe(true);
  }
  await page.getByRole('tab', { name: demoEditorLabel(nextLocale, 'Config'), exact: true }).click();
  const configInput = page
    .getByRole('heading', { name: demoEditorLabel(nextLocale, 'Config'), exact: true })
    .locator('../..')
    .locator('.inputarea, .native-edit-context');
  await configInput.focus();
  await page.keyboard.press('ControlOrMeta+A');
  await configInput.evaluate((element) => {
    const clipboardData = new DataTransfer();
    clipboardData.setData('text/plain', '[]');
    element.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
    );
  });
  await button(next['editor.config.apply']).click();
  const diagnostic = next['editor.objectRequired'].replace('{label}', next['editor.config.label']);
  await expect.poll(() => page.getByText(diagnostic, { exact: false }).isVisible()).toBe(true);
  await button(next['editor.config.reload']).click();
  await expect
    .poll(() => page.getByText(next['editor.config.loaded'], { exact: true }).isVisible())
    .toBe(true);
  await button(next['editor.config.apply']).click();
  await expect
    .poll(() => page.getByText(next['editor.config.applied'], { exact: true }).isVisible())
    .toBe(true);
  await page.goto(`${base}/${family}/#/examples/no-such-example-4857`);
  await expect
    .poll(() =>
      page
        .getByText(next['example.notFound'].replace('{name}', 'no-such-example-4857'), {
          exact: true,
        })
        .isVisible(),
    )
    .toBe(true);
  await page.goto(`${base}/${family}/#/`);
  await expect
    .poll(() =>
      page
        .getByRole('heading', {
          name: next['home.welcome'].replace(
            '{library}',
            family === 'shadcn' ? 'Shadcn' : family === 'flowbite' ? 'Flowbite' : 'Skeleton',
          ),
          exact: true,
        })
        .isVisible(),
    )
    .toBe(true);
  expect(errors).toEqual([]);
});
