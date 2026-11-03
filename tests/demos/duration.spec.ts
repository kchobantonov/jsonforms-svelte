import type { JsonFormsFlowbiteElement } from '../../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import { mkdir } from 'node:fs/promises';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';
import { demoEditorLabel } from '../helpers/demo-labels';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';
import fields from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/translations.supplement.json';
import data from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-temporal-controls/data.json';

demoTest(
  'duration',
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
      `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const duration = page.getByRole('combobox', {
      name: fields[locale][
        'specTemporalControls.schema.properties.schemaBased.properties.duration.label'
      ],
      exact: true,
    });
    await expect
      .poll(() => duration.inputValue(), { timeout: 10_000 })
      .toBe(data.schemaBased.duration);
    const control = page.locator(
      `[id=${JSON.stringify((await duration.getAttribute('id'))!.replace(/-input$/, ''))}]`,
    );
    await duration.fill('P1DT');
    await duration.blur();
    await expect.poll(() => duration.inputValue()).toBe('P1DT');
    await expect.poll(() => duration.getAttribute('aria-invalid')).toBe('true');
    await duration.fill('PT90M');
    await expect.poll(() => duration.getAttribute('aria-invalid')).toBe('false');
    const open = () =>
      control.getByRole('button', { name: messages[locale]['duration.open'], exact: true }).click();
    await open();
    const minutes = page.getByRole('spinbutton', {
      name: messages[locale]['duration.minutes'],
      exact: true,
    });
    await minutes.fill('120');
    await expect
      .poll(async () => {
        const anchor = await control
          .getByRole('button', { name: messages[locale]['duration.open'], exact: true })
          .boundingBox();
        const popup = await minutes.boundingBox();
        return anchor !== null && popup !== null && Math.abs(popup.y - anchor.y) < 400;
      })
      .toBe(true);
    if (locale === 'en' && webcomponent) {
      const form = page.locator(`jsonforms-svelte-${family}`);
      await mkdir('test-results', { recursive: true });
      await page.setViewportSize({ width: 390, height: 900 });
      await duration.evaluate((element) => element.scrollIntoView({ block: 'center' }));
      await expect
        .poll(async () => {
          const bounds = await minutes.boundingBox();
          return bounds !== null && bounds.y > 55 && bounds.y + bounds.height < 900;
        })
        .toBe(true);
      for (const mode of ['light', 'dark']) {
        await form.evaluate((element, mode) => {
          (element as JsonFormsFlowbiteElement).mode = mode;
        }, mode);
        await page.screenshot({
          path: `test-results/duration-${family}-${mode}-narrow.png`,
          animations: 'disabled',
        });
      }
      await form.evaluate((element) => {
        (element as JsonFormsFlowbiteElement).mode = 'light';
      });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await expect.poll(() => duration.inputValue()).toBe('PT90M');
    await page
      .getByRole('button', { name: messages[locale]['duration.cancel'], exact: true })
      .click();
    await expect.poll(() => duration.inputValue()).toBe('PT90M');
    await open();
    await expect.poll(() => minutes.inputValue()).toBe('90');
    await minutes.fill('120');
    await page.getByRole('button', { name: messages[locale]['duration.ok'], exact: true }).click();
    await expect.poll(() => duration.inputValue()).toBe('PT120M');
    const weeks = page.getByRole('combobox', {
      name: fields[locale][
        'specTemporalControls.schema.properties.schemaBased.properties.weeks.label'
      ],
      exact: true,
    });
    const weeksControl = page.locator(
      `[id=${JSON.stringify((await weeks.getAttribute('id'))!.replace(/-input$/, ''))}]`,
    );
    await weeks.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await weeksControl
      .getByRole('button', { name: messages[locale]['duration.open'], exact: true })
      .click();
    await page
      .getByRole('spinbutton', { name: messages[locale]['duration.weeks'], exact: true })
      .fill('4');
    await expect.poll(() => weeks.inputValue()).toBe('P4W');
    await expect
      .poll(() =>
        page.getByRole('button', { name: messages[locale]['duration.ok'], exact: true }).count(),
      )
      .toBe(0);
    expect(errors).toEqual([]);
  },
  { timeout: 20_000 },
);

demoTest(
  'duration unchanged spelling',
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
      `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const expected = { ...data, schemaBased: { ...data.schemaBased, duration: 'P0W' } };
    await applyDemoEditor(page, locale, 'Data', expected, { verifyVisibleText: false });
    await page
      .getByRole('tab', { name: new RegExp('^' + demoEditorLabel(locale, 'Demo')) })
      .click();
    const duration = page.getByRole('combobox', {
      name: fields[locale][
        'specTemporalControls.schema.properties.schemaBased.properties.duration.label'
      ],
      exact: true,
    });
    await expect.poll(() => duration.inputValue()).toBe('P0W');
    const control = page.locator(
      `[id=${JSON.stringify((await duration.getAttribute('id'))!.replace(/-input$/, ''))}]`,
    );
    await control
      .getByRole('button', { name: messages[locale]['duration.open'], exact: true })
      .click();
    await page.getByRole('button', { name: messages[locale]['duration.ok'], exact: true }).click();
    await expect.poll(() => duration.inputValue()).toBe('P0W');
    await page.getByRole('tab', { name: demoEditorLabel(locale, 'Data'), exact: true }).click();
    const editor = page.locator('.monaco-editor:visible');
    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await expect
      .poll(async () => {
        await editor.locator('.inputarea, .native-edit-context').focus();
        await page.keyboard.press('ControlOrMeta+A');
        await page.keyboard.press('ControlOrMeta+C');
        return JSON.parse(await page.evaluate(() => navigator.clipboard.readText()));
      })
      .toEqual(expected);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);

demoTest(
  'duration short-viewport popup',
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
    await page.setViewportSize({ width: 390, height: 450 });
    await page.goto(
      `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const duration = page.getByRole('combobox', {
      name: fields[locale][
        'specTemporalControls.schema.properties.schemaBased.properties.duration.label'
      ],
      exact: true,
    });
    await duration.fill('P1Y2M3DT4H5M6S');
    await expect.poll(() => duration.getAttribute('aria-invalid')).toBe('false');
    await duration.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    const control = page.locator(
      `[id=${JSON.stringify((await duration.getAttribute('id'))!.replace(/-input$/, ''))}]`,
    );
    await control
      .getByRole('button', { name: messages[locale]['duration.open'], exact: true })
      .click();
    const seconds = page.getByRole('spinbutton', {
      name: messages[locale]['duration.seconds'],
      exact: true,
    });
    const popupState = () =>
      seconds.evaluate((element) => {
        let scroller: HTMLElement | null = element.parentElement;
        while (scroller && getComputedStyle(scroller).overflowY !== 'auto')
          scroller = scroller.parentElement;
        if (!scroller) return null;
        const bounds = scroller.getBoundingClientRect();
        const final = element.getBoundingClientRect();
        return {
          top: bounds.top,
          bottom: bounds.bottom,
          open: scroller.closest('[popover]')?.matches(':popover-open') ?? true,
          scrollHeight: scroller.scrollHeight,
          clientHeight: scroller.clientHeight,
          finalTop: final.top,
          finalBottom: final.bottom,
          rootIsShadow: scroller.getRootNode() instanceof ShadowRoot,
        };
      });
    await expect.poll(popupState).not.toBeNull();
    if (family === 'flowbite') await expect.poll(async () => (await popupState())?.open).toBe(true);
    const before = (await popupState())!;
    expect(before.rootIsShadow).toBe(webcomponent);
    expect(before.top).toBeGreaterThanOrEqual(0);
    expect(before.bottom).toBeLessThanOrEqual(450);
    expect(before.scrollHeight).toBeGreaterThan(before.clientHeight);
    await seconds.focus();
    await expect
      .poll(async () => {
        const state = await popupState();
        return !!state && state.finalTop >= state.top && state.finalBottom <= state.bottom;
      })
      .toBe(true);
    await seconds.fill('9');
    await expect.poll(() => seconds.inputValue()).toBe('9');
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
