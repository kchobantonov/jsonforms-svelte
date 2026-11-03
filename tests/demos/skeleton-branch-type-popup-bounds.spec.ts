import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';

demoTest(
  'skeleton-branch-type-popup-bounds',
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
      `${base}/${family}/#/examples/spec-json-inference?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page.setViewportSize({ width: 390, height: 300 });
    const applySchema = (value: unknown) =>
      applyDemoEditor(page, locale, 'Schema', value, { verifyVisibleText: false });
    const showDemo = async () =>
      page.getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) }).click();
    const inspectPopup = async (
      input: ReturnType<typeof page.locator>,
      lastLabel: string,
      count: number,
    ) => {
      await input.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await input.click();
      const last = page.getByRole('option', { name: lastLabel, exact: true });
      const popup = last.locator(
        'xpath=ancestor::*[@data-scope="combobox" and @data-part="content"][1]',
      );
      await expect.poll(() => popup.getByRole('option').count()).toBe(count);
      await expect
        .poll(async () => {
          const bounds = await popup.boundingBox();
          return !!bounds && bounds.y >= 0 && bounds.y + bounds.height <= 300;
        })
        .toBe(true);
      expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(await popup.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(
        true,
      );
      await popup.hover();
      await page.mouse.wheel(0, 10000);
      await expect
        .poll(async () => {
          const item = await last.boundingBox();
          const bounds = await popup.boundingBox();
          return (
            !!item &&
            !!bounds &&
            item.y >= bounds.y &&
            item.y + item.height <= bounds.y + bounds.height
          );
        })
        .toBe(true);
      await last.click();
      await expect.poll(() => popup.count()).toBe(0);
    };

    await applySchema({
      title: 'Variant choice',
      oneOf: Array.from({ length: 40 }, (_, index) => ({
        type: 'object',
        title: `Variant ${index}`,
        properties: { value: { type: 'string', const: `value-${index}` } },
      })),
    });
    await applyDemoEditor(page, locale, 'UI Schema', { type: 'Control', scope: '#' });
    await applyDemoEditor(page, locale, 'Data', {});
    await showDemo();
    await inspectPopup(
      page.getByRole('combobox', { name: 'Variant choice', exact: true }),
      'Variant 39',
      40,
    );
    await page.getByRole('button', { name: locale === 'bg' ? 'Да' : 'Yes', exact: true }).click();
    await expect
      .poll(() => page.getByRole('combobox', { name: 'Variant choice', exact: true }).inputValue())
      .toBe('Variant 39');
    const branchInput = page.getByRole('combobox', { name: 'Variant choice', exact: true });
    await branchInput.click();
    const finalBranch = page.getByRole('option', { name: 'Variant 39', exact: true });
    await branchInput.press('End');
    await expect.poll(() => finalBranch.getAttribute('data-highlighted')).not.toBeNull();
    await branchInput.press('Enter');
    await expect.poll(() => finalBranch.count()).toBe(0);
    await branchInput.click();
    const branchPopup = finalBranch.locator(
      'xpath=ancestor::*[@data-scope="combobox" and @data-part="content"][1]',
    );
    await expect
      .poll(async () => {
        const bounds = await branchPopup.boundingBox();
        return !!bounds && bounds.y >= 0 && bounds.y + bounds.height <= 300;
      })
      .toBe(true);
    await branchPopup.evaluate((element) => {
      element.scrollTop = 0;
    });
    const cdp = await page.context().newCDPSession(page);
    const touchBounds = (await branchPopup.boundingBox())!;
    await cdp.send('Input.synthesizeScrollGesture', {
      x: touchBounds.x + touchBounds.width / 2,
      y: touchBounds.y + touchBounds.height / 2,
      yDistance: -(await branchPopup.evaluate((element) => element.scrollHeight)),
      speed: 2000,
      preventFling: true,
      gestureSourceType: 'touch',
    });
    await expect
      .poll(async () => {
        const item = await finalBranch.boundingBox();
        const list = await branchPopup.boundingBox();
        return !!item && !!list && item.y >= list.y && item.y + item.height <= list.y + list.height;
      })
      .toBe(true);
    await finalBranch.tap();
    await cdp.detach();
    await expect.poll(() => branchPopup.count()).toBe(0);

    await applySchema({
      title: 'Mixed value',
      type: ['string', 'number', 'boolean', 'object', 'array', 'null'],
    });
    await applyDemoEditor(page, locale, 'Data', null);
    await showDemo();
    const mixedInput = page.locator(
      '[data-scope="combobox"][data-part="input"][id$="-input-selector"]',
    );
    await mixedInput.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await mixedInput.click();
    const mixedPopup = page.locator('[data-scope="combobox"][data-part="content"]');
    await expect.poll(() => mixedPopup.getByRole('option').count()).toBe(6);
    await expect
      .poll(async () => {
        const bounds = await mixedPopup.boundingBox();
        return !!bounds && bounds.y >= 0 && bounds.y + bounds.height <= 300;
      })
      .toBe(true);
    expect(
      await mixedPopup.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
    ).toBe(webcomponent);
    expect(
      await mixedPopup.evaluate((element) => element.scrollHeight > element.clientHeight),
    ).toBe(true);
    expect(errors).toEqual([]);
  },
  { families: ['skeleton'], hasTouch: true, timeout: 60_000 },
);
