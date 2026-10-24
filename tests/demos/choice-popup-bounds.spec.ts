import { expect } from 'vitest';
import type { Locator } from 'playwright';
import { demoTest } from '../helpers/demo';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

const choices = Array.from({ length: 100 }, (_, index) => `Option ${index}`);

demoTest(
  'choice-popup-bounds',
  async ({ page, family, locale, webcomponent, base }) => {
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-choice-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const apply = async (name: string, value: unknown) => {
      const label = demoEditorLabel(locale, name);
      await page.getByRole('tab', { name: label, exact: true }).click();
      const toolbar = page.getByRole('heading', { name: label, exact: true }).locator('..');
      const editor = toolbar.locator('..').locator('.monaco-editor');
      const input = editor.locator('.inputarea, .native-edit-context');
      await input.focus();
      await page.keyboard.press('ControlOrMeta+A');
      await input.evaluate((element, text) => {
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', text);
        element.dispatchEvent(
          new ClipboardEvent('paste', { clipboardData, bubbles: true, cancelable: true }),
        );
      }, JSON.stringify(value));
      await editor.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
      await toolbar.getByRole('button').nth(1).click();
    };
    await apply('Schema', {
      type: 'object',
      properties: {
        single: { type: 'string', enum: choices },
        multiple: { type: 'array', items: { type: 'string', enum: choices }, uniqueItems: true },
      },
    });
    await apply('UI Schema', {
      type: 'VerticalLayout',
      elements: [
        {
          type: 'Control',
          scope: '#/properties/single',
          label: 'Single',
          options: { autocomplete: true },
        },
        {
          type: 'Control',
          scope: '#/properties/multiple',
          label: 'Multiple',
          options: { variant: 'multi-select' },
        },
      ],
    });
    await apply('Data', {});
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    await page.setViewportSize({ width: 390, height: 450 });
    const popup = page.locator('[data-slot="popover-content"][data-state="open"]');
    const visibleInside = async (item: Locator, container: Locator) => {
      const a = await item.boundingBox();
      const b = await container.boundingBox();
      return !!a && !!b && a.y >= b.y - 1 && a.y + a.height <= b.y + b.height + 1;
    };
    const cdp = await page.context().newCDPSession(page);
    for (const multiple of [false, true]) {
      const trigger = page.getByRole(multiple ? 'button' : 'combobox', {
        name: multiple ? 'Multiple' : 'Single',
        exact: true,
      });
      for (const method of ['wheel', 'keyboard', 'touch']) {
        await trigger.click();
        await popup.waitFor();
        const list = popup.locator(multiple ? '[role="group"]' : '[data-slot="command-list"]');
        await expect
          .poll(async () => {
            const rect = await popup.boundingBox();
            return !!rect && rect.y >= 0 && rect.y + rect.height <= 450 && rect.height <= 320;
          })
          .toBe(true);
        expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
          webcomponent,
        );
        const search = popup.getByRole(multiple ? 'textbox' : 'combobox', {
          name: messages[locale]['arrayChoices.search'],
          exact: true,
        });
        const last = popup.getByRole(multiple ? 'checkbox' : 'option', {
          name: 'Option 99',
          exact: true,
        });
        // Native popovers can retain their scroll position between openings.
        // Reset only the starting state so each input method must reach the end itself.
        await list.evaluate((element) => {
          element.scrollTop = 0;
        });
        await expect.poll(() => visibleInside(last, list)).toBe(false);
        if (method === 'wheel') {
          await list.hover();
          await page.mouse.wheel(0, 10000);
        } else if (method === 'keyboard') {
          await search.focus();
          if (multiple) for (let index = 0; index < 100; index++) await page.keyboard.press('Tab');
          else await page.keyboard.press('End');
        } else {
          // Real touch gestures scroll the native list; do not assign scrollTop.
          for (let index = 0; index < 30 && !(await visibleInside(last, list)); index++) {
            const rect = (await list.boundingBox())!;
            const x = rect.x + rect.width / 2;
            const start = rect.y + rect.height - 8;
            await cdp.send('Input.dispatchTouchEvent', {
              type: 'touchStart',
              touchPoints: [{ x, y: start }],
            });
            for (let step = 1; step <= 5; step++) {
              await cdp.send('Input.dispatchTouchEvent', {
                type: 'touchMove',
                touchPoints: [{ x, y: start - ((rect.height - 16) * step) / 5 }],
              });
              // Let Chromium apply each touch move before sending the next frame.
              await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
            }
            await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          }
        }
        await expect
          .poll(async () => ({ method, multiple, visible: await visibleInside(last, list) }))
          .toEqual({ method, multiple, visible: true });
        expect(await visibleInside(search, popup)).toBe(true);
        const finalBounds = (await popup.boundingBox())!;
        expect(finalBounds.y).toBeGreaterThanOrEqual(0);
        expect(finalBounds.y + finalBounds.height).toBeLessThanOrEqual(450);
        if (locale === 'en' && method === 'wheel')
          await page.screenshot({
            path: `test-results/choice-popup-${multiple ? 'multiple' : 'single'}-${webcomponent ? 'shadow' : 'native'}.png`,
            animations: 'disabled',
          });
        if (method === 'keyboard') await page.keyboard.press(multiple ? 'Space' : 'Enter');
        else if (method === 'touch') await last.tap();
        else await last.click();
        if (multiple) {
          await page.keyboard.press('Escape');
          await page
            .getByRole('button', {
              name: messages[locale]['arrayChoices.remove'].replace('{label}', 'Option 99'),
              exact: true,
            })
            .click();
          await expect
            .poll(() =>
              page
                .getByRole('button', {
                  name: messages[locale]['arrayChoices.remove'].replace('{label}', 'Option 99'),
                  exact: true,
                })
                .count(),
            )
            .toBe(0);
        } else {
          await expect.poll(() => trigger.textContent()).toContain('Option 99');
          await trigger.focus();
          await page
            .getByRole('button', { name: messages[locale]['control.clearValue'], exact: true })
            .click();
          await expect
            .poll(() => trigger.textContent())
            .toContain(messages[locale]['control.selectOption']);
        }
        await popup.waitFor({ state: 'hidden' });
      }
    }
    await cdp.detach();
    expect(errors).toEqual([]);
  },
  { families: ['shadcn'], hasTouch: true },
);
