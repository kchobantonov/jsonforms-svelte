import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import { applyDemoEditor } from '../helpers/demo-editor';
import { touchScrollToEnd } from '../helpers/touch-scroll';
import translations from '@chobantonov/jsonforms-extended-spec/examples/cron-control/translations.json';
import sourceUi from '@chobantonov/jsonforms-extended-spec/examples/cron-control/uischema.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'cron-control',
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
      `${process.env.JSONFORMS_DEMO_URL ?? `${base}/${family}/`}#/examples/spec-cron-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const raw = page.locator('input[id*="/properties/stockSync"]:visible');
    await raw.waitFor();
    assert.equal(await raw.inputValue(), '0 0/15 * * * *');
    const picker = page
      .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
      .first();
    assert.equal((await picker.textContent())?.trim(), '');
    assert.equal(await picker.locator('svg').count(), 1);
    // Read both rectangles in one browser frame; loading styles can move the field.
    await expect
      .poll(async () =>
        picker.evaluate((button) => {
          const input = button.closest('[data-cron-input]')!.querySelector('input')!;
          const field = input.getBoundingClientRect();
          const icon = button.getBoundingClientRect();
          return {
            horizontal: icon.x >= field.x && icon.right <= field.right,
            vertical: icon.y >= field.y && icon.bottom <= field.bottom,
          };
        }),
      )
      .toEqual({ horizontal: true, vertical: true });
    if (locale === 'en' && webcomponent)
      await page
        .locator(`jsonforms-svelte-${family}`)
        .screenshot({ path: `test-results/cron-icon-${family}.png`, animations: 'disabled' });

    await picker.focus();
    const chooseHint = page
      .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
      .filter({ hasText: messages[locale]['cron.choose'] })
      .first();
    await expect.poll(() => chooseHint.isVisible()).toBe(true);
    expect(
      await chooseHint.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
    ).toBe(webcomponent);
    expect(
      await chooseHint.evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('Escape');
    await expect.poll(() => chooseHint.isVisible()).toBe(false);
    expect(await picker.evaluate((element) => element.matches(':focus'))).toBe(true);
    if (family === 'flowbite')
      await expect.poll(() => page.locator('[data-cron-picker]:visible').count()).toBe(0);

    await page
      .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
      .first()
      .click();
    const expression = page.getByRole('textbox', {
      name: messages[locale]['cron.expression'],
      exact: true,
    });
    const panel = page.locator('[data-cron-picker]:visible');
    const clearSecondName = `${messages[locale]['cron.every']}: ${messages[locale]['cron.second']}`;
    const clearSecond = panel.getByRole('button', { name: clearSecondName, exact: true });
    await expect.poll(() => clearSecond.count()).toBe(1);
    await clearSecond.focus();
    if (family === 'shadcn')
      await expect
        .poll(() => clearSecond.evaluate((element) => getComputedStyle(element).opacity))
        .toBe('1');
    const fieldHint = page
      .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
      .filter({
        hasText: new RegExp(`^${clearSecondName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
      })
      .first();
    await expect.poll(() => fieldHint.isVisible()).toBe(true);
    expect(await fieldHint.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(
      await fieldHint.evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('Escape');
    await expect.poll(() => fieldHint.isVisible()).toBe(false);
    await expect
      .poll(() => clearSecond.evaluate((element) => element.matches(':focus')))
      .toBe(true);
    await expect.poll(() => panel.isVisible()).toBe(true);
    assert.equal(await expression.inputValue(), '0 0/15 * * * *');
    assert.equal(await raw.inputValue(), '0 0/15 * * * *');
    await page.keyboard.press('Escape');
    await expect.poll(() => panel.isVisible()).toBe(false);
    assert.equal(await raw.inputValue(), '0 0/15 * * * *');
    await picker.click();
    await expect.poll(() => panel.isVisible()).toBe(true);
    await clearSecond.click();
    await expect.poll(() => expression.inputValue()).toBe('* 0/15 * * * *');
    const period = panel.getByLabel(messages[locale]['cron.repeats'], { exact: true });
    if (await period.evaluate((element) => element.tagName === 'SELECT'))
      await period.selectOption('month');
    else {
      await period.click();
      await page
        .getByRole('option', { name: messages[locale]['cron.period.month'], exact: true })
        .click();
    }
    await panel.getByLabel(messages[locale]['cron.dayOfMonth'], { exact: true }).first().waitFor();
    const bounds = await panel.boundingBox();
    expect(bounds!.height).toBeLessThan(440);
    expect(bounds!.width).toBeLessThan(family === 'shadcn' ? 400 : 360);
    if (locale === 'en' && webcomponent) {
      await page.screenshot({
        path: `test-results/cron-compact-${family}.png`,
        animations: 'disabled',
      });
    }
    if (family === 'shadcn') {
      await panel.getByLabel(messages[locale]['cron.minute'], { exact: true }).click();
      const list = page.locator('[data-slot=select-content][data-state=open]');
      expect((await list.boundingBox())!.height).toBeLessThanOrEqual(256);
      await list.hover();
      await page.mouse.wheel(0, 2000);
      const last = list.getByRole('option', { name: '59', exact: true });
      await expect
        .poll(async () => {
          const item = await last.boundingBox();
          const box = await list.boundingBox();
          return !!item && !!box && item.y >= box.y && item.y + item.height <= box.y + box.height;
        })
        .toBe(true);
      await last.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      await last.click();
      await expect.poll(() => expression.inputValue()).toContain('59');
      if (locale === 'en' && webcomponent) {
        await page.screenshot({
          path: 'test-results/cron-scroll-shadcn.png',
          animations: 'disabled',
        });
      }
      await page.keyboard.press('Escape');
    }
    await expression.fill('0 0 10 * * *');
    await page.getByRole('button', { name: messages[locale]['cron.cancel'], exact: true }).click();
    assert.equal(await raw.inputValue(), '0 0/15 * * * *');
    await page
      .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
      .first()
      .click();
    await expression.fill('0 0 11 * * *');
    await page.getByRole('button', { name: messages[locale]['cron.ok'], exact: true }).click();
    await expect.poll(() => raw.inputValue()).toBe('0 0 11 * * *');
    const clear = page
      .locator('[data-cron-input]')
      .first()
      .getByRole('button', { name: messages[locale]['control.clearValue'], exact: true });
    await page.mouse.move(0, 0);
    await raw.evaluate((element) => (element as HTMLInputElement).blur());
    await picker.evaluate((element) => (element as HTMLButtonElement).blur());
    await expect.poll(() => clear.isVisible()).toBe(false);
    await raw.hover();
    await expect.poll(() => clear.isVisible()).toBe(true);
    await page.mouse.move(0, 0);
    await expect.poll(() => clear.isVisible()).toBe(false);
    await raw.focus();
    await expect.poll(() => clear.isVisible()).toBe(true);
    const clearBox = (await clear.boundingBox())!;
    const fieldBox = (await raw.boundingBox())!;
    assert.ok(
      clearBox.x >= fieldBox.x && clearBox.x + clearBox.width <= fieldBox.x + fieldBox.width,
    );
    if (locale === 'en' && webcomponent)
      await page
        .locator('[data-cron-input]')
        .first()
        .screenshot({ path: `test-results/cron-clear-${family}.png`, animations: 'disabled' });
    await clear.focus();
    assert.equal(await clear.isVisible(), true);
    const clearHint = page
      .locator(family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible')
      .filter({ hasText: messages[locale]['control.clearValue'] })
      .first();
    await expect.poll(() => clearHint.isVisible()).toBe(true);
    expect(await clearHint.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    expect(
      await clearHint.evaluate((element) => getComputedStyle(element).backgroundColor),
    ).not.toBe('rgba(0, 0, 0, 0)');
    await page.keyboard.press('Escape');
    await expect.poll(() => clearHint.isVisible()).toBe(false);
    await expect.poll(() => clear.evaluate((element) => element.matches(':focus'))).toBe(true);
    await clear.press('Enter');
    await expect.poll(() => raw.inputValue()).toBe('');
    assert.equal(await clear.count(), 0);

    await page
      .getByRole('tab', {
        name: translations[locale]['featureNavigation.section3.label'],
        exact: true,
      })
      .click();
    assert.equal(
      await page.locator('input[id*="/properties/unixFiveField"]:visible').inputValue(),
      '*/15 * * * *',
    );
    assert.equal(
      await page.locator('input[id*="/properties/quartzSevenField"]:visible').inputValue(),
      '0 0 12 ? * MON 2027',
    );
    assert.deepEqual(errors, []);
  },
  { timeout: 15_000 },
);

demoTest(
  'cron short-viewport minute selector',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.setViewportSize({ width: 390, height: 450 });
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-cron-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('button', { name: messages[locale]['cron.choose'], exact: true })
      .first()
      .click();
    const panel = page.locator('[data-cron-picker]:visible');
    await (
      family === 'skeleton'
        ? panel.getByRole('button', { name: messages[locale]['cron.minute'], exact: true })
        : family === 'flowbite'
          ? panel.getByRole('listbox', { name: messages[locale]['cron.minute'], exact: true })
          : panel.getByLabel(messages[locale]['cron.minute'], { exact: true })
    ).click();
    const list = page.locator(
      family === 'shadcn'
        ? '[data-slot=select-content][data-state=open]'
        : family === 'skeleton'
          ? '[data-scope="combobox"][data-part="content"][data-state="open"]'
          : '[data-cron-choice] [role="listbox"] > [role="presentation"]',
    );
    await expect
      .poll(async () => {
        const box = await list.boundingBox();
        return (
          !!box &&
          box.y >= 0 &&
          box.y + box.height <= 450 &&
          box.height <= (family === 'skeleton' ? 320 : 256)
        );
      })
      .toBe(true);
    expect(await list.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      webcomponent,
    );
    if (family === 'shadcn') await list.hover();
    else {
      const wheelBounds = (await list.boundingBox())!;
      await page.mouse.move(
        wheelBounds.x + wheelBounds.width / 2,
        wheelBounds.y + wheelBounds.height / 2,
      );
    }
    if (family === 'flowbite') {
      expect(await list.evaluate((element) => getComputedStyle(element).overscrollBehaviorY)).toBe(
        'contain',
      );
      expect(await list.evaluate((element) => getComputedStyle(element).touchAction)).toBe('pan-y');
    }
    await page.mouse.wheel(0, 5000);
    const last =
      family === 'flowbite'
        ? list.getByText('59', { exact: true })
        : list.getByRole('option', { name: '59', exact: true });
    await expect
      .poll(async () => {
        const item = await last.boundingBox();
        const box = await list.boundingBox();
        return !!item && !!box && item.y >= box.y && item.y + item.height <= box.y + box.height;
      })
      .toBe(true);
    await expect
      .poll(async () => {
        const box = await list.boundingBox();
        return (
          !!box && box.x >= 0 && box.x + box.width <= 390 && box.y >= 0 && box.y + box.height <= 450
        );
      })
      .toBe(true);
    if (family !== 'shadcn') {
      await page.mouse.move(0, 0);
      if (family === 'flowbite') {
        // Flowbite creates a new scroll surface on each opening. Keep the
        // touch gesture independent of the preceding wheel gesture.
        const trigger = panel.getByRole('listbox', {
          name: messages[locale]['cron.minute'],
          exact: true,
        });
        await trigger.press('Escape');
        await expect.poll(() => list.count()).toBe(0);
        await trigger.click();
        await list.waitFor();
      } else {
        await list.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
      }
      await list.evaluate((element) => {
        element.scrollTop = 0;
      });
      expect(await list.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
        true,
      );
      const cdp = await page.context().newCDPSession(page);
      await touchScrollToEnd(cdp, list);
      await expect.poll(() => list.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await last.scrollIntoViewIfNeeded();
      await expect
        .poll(
          async () => {
            const item = await last.boundingBox();
            const box = await list.boundingBox();
            return !!item && !!box && item.y >= box.y && item.y + item.height <= box.y + box.height;
          },
          { timeout: 10_000 },
        )
        .toBe(true);
    }
    await last.click();
    await expect
      .poll(() =>
        panel.getByRole('textbox', { name: messages[locale]['cron.expression'] }).inputValue(),
      )
      .toContain('59');
    if (family === 'flowbite') {
      await page.keyboard.press('Escape');
      const trigger = panel.getByRole('listbox', { name: messages[locale]['cron.minute'] });
      await trigger.focus();
      await trigger.press('ArrowDown');
      await trigger.press('ArrowUp');
      const active = list.locator('[data-active="true"]');
      await expect.poll(() => active.textContent()).toBe('59');
      await expect
        .poll(async () => {
          const item = await active.boundingBox();
          const box = await list.boundingBox();
          return !!item && !!box && item.y >= box.y && item.y + item.height <= box.y + box.height;
        })
        .toBe(true);
    }
  },
  { hasTouch: true, timeout: 45_000 },
);

demoTest(
  'cron-control empty schedule and schema validation',
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
      `${base}/${family}/#/examples/spec-cron-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', { name: translations[locale]['featureNavigation.section2.label'] })
      .click();
    const cacheWarm = page.locator('input[id*="/properties/cacheWarm"]:visible');
    const unset = page.locator('input[id*="/properties/unset"]:visible');
    await expect.poll(() => cacheWarm.inputValue()).toBe('10 * * * * *');
    await expect.poll(() => unset.inputValue()).toBe('');
    expect(await unset.getAttribute('placeholder')).toBe('0 0 3 * * *');

    await page
      .locator('[data-cron-input]')
      .filter({ has: unset })
      .getByRole('button', { name: messages[locale]['cron.choose'] })
      .click();
    const panel = page.locator('[data-cron-picker]:visible');
    const expression = panel.getByRole('textbox', { name: messages[locale]['cron.expression'] });
    const period = panel.getByLabel(messages[locale]['cron.repeats'], { exact: true });
    await expect.poll(() => expression.inputValue()).toBe('');
    if (await period.evaluate((element) => element.tagName === 'SELECT'))
      await period.selectOption('year');
    else {
      await period.click();
      await page
        .getByRole('option', { name: messages[locale]['cron.period.year'], exact: true })
        .click();
    }
    await expect.poll(() => expression.inputValue()).toBe('');
    await panel.getByRole('button', { name: messages[locale]['cron.ok'] }).click();
    await expect.poll(() => unset.inputValue()).toBe('');

    await page
      .getByRole('tab', { name: translations[locale]['featureNavigation.section3.label'] })
      .click();
    const unix = page.locator('input[id*="/properties/unixFiveField"]:visible');
    const quartz = page.locator('input[id*="/properties/quartzSevenField"]:visible');
    await expect.poll(() => unix.inputValue()).toBe('*/15 * * * *');
    await expect.poll(() => quartz.inputValue()).toBe('0 0 12 ? * MON 2027');
    await expect.poll(() => unix.getAttribute('aria-invalid')).toBe('true');
    await expect.poll(() => quartz.getAttribute('aria-invalid')).toBe('true');

    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const lines = page.locator('.monaco-editor:visible .view-lines');
    await lines.waitFor();
    const data = JSON.parse((await lines.innerText()).replaceAll('\u00a0', ' '));
    expect(data.selectedByUiSchema).toEqual({ cacheWarm: '10 * * * * *' });
    expect(data.rejected).toEqual({
      unixFiveField: '*/15 * * * *',
      quartzSevenField: '0 0 12 ? * MON 2027',
    });
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);

demoTest(
  'cron-control immediate action and clear opt-out',
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
      `${base}/${family}/#/examples/spec-cron-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    type Node = { scope?: string; options?: Record<string, unknown>; elements?: Node[] };
    const ui: Node = structuredClone(sourceUi);
    const find = (node: Node): Node | undefined =>
      node.scope === '#/properties/selectedBySchema/properties/stockSync'
        ? node
        : node.elements?.map(find).find((candidate) => candidate !== undefined);
    const stock = find(ui);
    assert.ok(stock);
    stock.options = { clearable: false, showActions: false };
    await applyDemoEditor(page, locale, 'UI Schema', ui, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp(`^${demoEditorLabel(locale, 'Demo')}`) })
      .click();
    const raw = page.locator('input[id*="/properties/stockSync"]:visible');
    await expect.poll(() => raw.inputValue()).toBe('0 0/15 * * * *');
    const input = page.locator('[data-cron-input]').filter({ has: raw });
    expect(
      await input.getByRole('button', { name: messages[locale]['control.clearValue'] }).count(),
    ).toBe(0);
    await input.getByRole('button', { name: messages[locale]['cron.choose'] }).click();
    const panel = page.locator('[data-cron-picker]:visible');
    expect(await panel.getByRole('button', { name: messages[locale]['cron.ok'] }).count()).toBe(0);
    expect(await panel.getByRole('button', { name: messages[locale]['cron.cancel'] }).count()).toBe(
      0,
    );
    await panel
      .getByRole('textbox', { name: messages[locale]['cron.expression'] })
      .fill('0 0 9 * * *');
    await expect.poll(() => raw.inputValue()).toBe('0 0 9 * * *');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    const editor = page.locator(
      '.monaco-editor:visible .inputarea, .monaco-editor:visible .native-edit-context',
    );
    await expect
      .poll(async () => {
        await editor.focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        try {
          return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))
            .selectedBySchema.stockSync;
        } catch {
          return undefined;
        }
      })
      .toBe('0 0 9 * * *');
    expect(errors).toEqual([]);
  },
);
