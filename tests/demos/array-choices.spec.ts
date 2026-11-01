import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-choices/translations.json';
import supplements from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-array-choices/supplemental-translations.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'array-choice-finite-presentations',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-array-choices?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const channels = page.getByRole('group', {
      name: supplements[locale]['channels.label'],
    });
    await channels.getByRole('checkbox', { name: 'SMS' }).check({ timeout: 3000 });
    await expect.poll(() => channels.getByRole('checkbox', { name: 'SMS' }).isChecked()).toBe(true);

    const select = async (property: 'alerts' | 'teams', label: string) => {
      const trigger =
        family === 'flowbite'
          ? page.getByRole('listbox', { name: supplements[locale][`${property}.label`] })
          : page.locator(`[id*="/properties/${property}-input"]:visible`);
      await trigger.click({ timeout: 3000 });
      if (family === 'flowbite') {
        const option = trigger
          .locator(':scope > [role="presentation"] > [role="presentation"]')
          .filter({ hasText: label });
        await option.click();
      } else {
        await page.getByRole('option', { name: label, exact: true }).click();
      }
      await page
        .getByRole('button', {
          name: messages[locale]['arrayChoices.remove'].replace('{label}', label),
          exact: true,
        })
        .waitFor();
      if (family !== 'flowbite') await page.keyboard.press('Escape');
    };
    await select('alerts', 'SMS');
    await select('teams', 'Finance');

    let data: { channels: string[]; alerts: string[]; teams: string[] };
    if (webcomponent) {
      const form = page.locator(`jsonforms-svelte-${family}`);
      data = await form.evaluate((element) => {
        const value = (element as HTMLElement & { data: string | typeof data }).data;
        return typeof value === 'string' ? JSON.parse(value) : value;
      });
    } else {
      const dataLabel = demoEditorLabel(locale, 'Data');
      await page.getByRole('tab', { name: dataLabel, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: dataLabel, exact: true }).locator('..');
      await toolbar
        .locator('..')
        .locator('.monaco-editor')
        .click({ position: { x: 80, y: 20 } });
      await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.keyboard.press('ControlOrMeta+A');
      await page.keyboard.press('ControlOrMeta+C');
      data = JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
    }
    expect(data.channels).toEqual(['Email', 'SMS']);
    expect(data.alerts).toEqual(['Email', 'Post', 'SMS']);
    expect(data.teams).toEqual(['ops', 'fin']);
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);

demoTest('array-choices', async ({ page, family, locale, webcomponent, base }) => {
  await page.addInitScript(
    ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
    { family, locale },
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(
    `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-array-choices?use-webcomponent=${webcomponent}&drawer=false`,
  );
  const catalog = translations[locale];
  const remove = (value: string) =>
    messages[locale]['arrayChoices.remove'].replace('{label}', value);
  await page
    .getByRole('tab', { name: catalog['featureNavigation.section2.label'], exact: true })
    .click();
  const codes = page.getByRole('button', { name: remove('A-117'), exact: true });
  assert.equal(await codes.count(), 2);
  await codes.first().click();
  await codes.first().waitFor();
  assert.equal(await codes.count(), 1);
  const tags = page.locator('input[id*="/properties/tags"]:visible');
  if (family === 'shadcn') {
    assert.equal(
      await tags.evaluate((input) => input.parentElement?.hasAttribute('aria-disabled')),
      true,
    );
  }
  await tags.fill('new-tag');
  await tags.press('Enter');
  await page.getByRole('button', { name: remove('new-tag'), exact: true }).waitFor();
  await page
    .locator('label:visible')
    .filter({ hasText: supplements[locale]['tags.label'] })
    .first()
    .waitFor();
  await page
    .getByRole('tab', { name: catalog['featureNavigation.section3.label'], exact: true })
    .click();
  assert.equal(
    await page.getByRole('button', { name: remove('Dover'), exact: true }).isDisabled(),
    true,
  );
  const imported = page.getByRole('button', { name: remove('Fax'), exact: true });
  const invalidFax = page.locator('span[aria-invalid="true"]').filter({ hasText: 'Fax' });
  await expect.poll(() => invalidFax.count()).toBe(1);
  await expect.poll(() => page.getByText(/Fax: /).count()).toBeGreaterThan(0);
  if (family === 'shadcn') {
    const styling = await invalidFax.evaluate((pill) => {
      const chip = getComputedStyle(pill);
      const error = getComputedStyle(pill.querySelector('.text-destructive')!);
      const field = pill.closest('[data-slot="field"]')!;
      const label = getComputedStyle(field.querySelector('[data-slot="field-label"]')!);
      return {
        chipBorders: ['Top', 'Right', 'Bottom', 'Left'].map((side) => ({
          width: chip.getPropertyValue(`border-${side.toLowerCase()}-width`),
          color: chip.getPropertyValue(`border-${side.toLowerCase()}-color`),
        })),
        errorColor: error.color,
        labelColor: label.color,
      };
    });
    expect(styling.chipBorders).toEqual(
      Array.from({ length: 4 }, () => ({ width: '1px', color: styling.errorColor })),
    );
    expect(styling.labelColor).not.toBe(styling.errorColor);
    const office = page.locator('input[id*="/properties/bonded"]:visible');
    const officeColor = await office.evaluate(
      (input) =>
        getComputedStyle(
          input.closest('[data-slot="field"]')!.querySelector('[data-slot="field-label"]')!,
        ).color,
    );
    expect(officeColor).not.toBe(styling.errorColor);
  }
  await imported.focus();
  await imported.press('Enter');
  await imported.waitFor({ state: 'hidden' });
  await expect.poll(() => invalidFax.count()).toBe(0);
  await expect.poll(() => page.getByText(/Fax: /).count()).toBe(0);
  assert.deepEqual(errors, []);
});

demoTest(
  'shadcn-multi-select-field',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-array-choices?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const options = page.locator('[data-slot="popover-content"] [data-slot="command-item"]');
    const alerts = page.locator('[role="combobox"][id*="/properties/alerts"]');
    await alerts.click();
    await expect.poll(() => options.count()).toBe(3);
    expect(await page.locator('[data-slot="popover-content"] input').count()).toBe(0);
    await options.filter({ hasText: 'SMS' }).click();
    await expect.poll(() => alerts.textContent()).toContain('SMS');
    await expect.poll(() => alerts.textContent()).toContain('Email');
    await page.keyboard.press('Escape');

    const teams = page.locator('[role="combobox"][id*="/properties/teams"]');
    await teams.click();
    await expect.poll(() => options.count()).toBe(3);
    expect(await page.locator('[data-slot="popover-content"] input').count()).toBe(0);
    expect(await page.locator('[data-slot="popover-content"] [role="checkbox"]').count()).toBe(0);
    // Branch titles are currently displayed as authored in the schema in every locale.
    await options.filter({ hasText: 'Engineering' }).click();
    await expect.poll(() => teams.textContent()).toContain('Engineering');
    await expect.poll(() => options.count()).toBe(3);

    const finance = options.filter({ hasText: 'Finance' });
    await finance.hover();
    await finance.click();
    await expect.poll(() => teams.textContent()).toContain('Finance');
    await expect.poll(() => finance.getAttribute('data-checked')).toBe('true');
    const rowColors = await finance.evaluate((row) => ({
      hovered: row.matches(':hover'),
      finance: getComputedStyle(row).backgroundColor,
    }));
    expect(rowColors.hovered).toBe(true);
    const engineeringBackground = await options
      .filter({ hasText: 'Engineering' })
      .evaluate((row) => getComputedStyle(row).backgroundColor);
    expect(rowColors.finance).not.toBe(engineeringBackground);

    await page
      .getByRole('tab', { name: translations[locale]['featureNavigation.section3.label'] })
      .click();
    const imported = page.locator('[role="combobox"][id*="/properties/imported"]');
    await imported.click();
    await expect.poll(() => options.count()).toBe(3);
    await options.filter({ hasText: 'SMS' }).click();
    await expect.poll(() => imported.textContent()).toContain('SMS');
    await expect.poll(() => imported.textContent()).toContain('Fax');
  },
  { families: ['shadcn'], timeout: 20_000 },
);

demoTest(
  'shadcn-chip-field-focus',
  async ({ page, family, webcomponent, base }) => {
    await page.goto(
      `${base}/${family}/#/examples/spec-array-choices?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page.getByRole('tab', { name: 'Free tokens' }).click();
    const catalog = page.locator('input[id*="/properties/tags"]:visible');
    const scans = page.locator('input[id*="/properties/scans"]:visible');
    const labels = page.locator('input[id*="/properties/labels"]:visible');
    await catalog.focus();
    const focused = await catalog.evaluate((input) => {
      const inner = getComputedStyle(input);
      const outer = getComputedStyle(input.parentElement!);
      return {
        innerBorder: inner.borderTopWidth,
        innerShadow: inner.boxShadow,
        outerShadow: outer.boxShadow,
      };
    });
    expect(focused.innerBorder).toBe('0px');
    expect(focused.innerShadow).toBe('none');
    expect(focused.outerShadow).not.toBe('none');
    await catalog.press('ArrowLeft');
    const selectedTag = page.locator('.jsonforms-array-tags [aria-selected="true"]');
    const selectedStyle = await selectedTag.evaluate((tag) => {
      const selected = getComputedStyle(tag);
      const idle = getComputedStyle(tag.parentElement!.querySelector('[aria-selected="false"]')!);
      return {
        shadow: selected.boxShadow,
        background: selected.backgroundColor,
        idleBackground: idle.backgroundColor,
      };
    });
    expect(selectedStyle.shadow).toBe('none');
    expect(selectedStyle.background).not.toBe(selectedStyle.idleBackground);
    for (const field of [scans, labels]) {
      expect(
        await field.evaluate(
          (input) => input.parentElement?.querySelector('button[aria-label^="Remove "]') !== null,
        ),
      ).toBe(true);
    }
  },
  { families: ['shadcn'], locales: ['en'] },
);
