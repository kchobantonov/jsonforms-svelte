import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'file feedback short-viewport popup',
  async ({ page, family, locale, webcomponent, base }) => {
    const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
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
      `${base}/${family}/#/examples/spec-file-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    await page
      .getByRole('tab', { name: text('Table cells', 'Клетки в таблица'), exact: true })
      .click();
    await page.getByRole('tab', { name: 'AG Grid', exact: true }).click();
    const input = page.locator('.ag-root:visible input[type="file"][multiple]').first();
    const revealInput = () =>
      expect
        .poll(async () => {
          await page
            .locator('.ag-root-wrapper:visible .ag-body-horizontal-scroll-viewport')
            .evaluate((element) => (element.scrollLeft = element.scrollWidth));
          return input.count();
        })
        .toBeGreaterThan(0);
    const cell = input.locator('xpath=ancestor::*[@data-file-control][1]');
    for (const name of ['third.txt', 'excess.txt']) {
      await revealInput();
      await input.setInputFiles({
        name,
        mimeType: 'text/plain',
        buffer: Buffer.from(name),
      });
    }
    await revealInput();
    const message = text(
      'These files were not added. A maximum of 3 attachments is allowed; existing files were kept.',
      'Файловете не са добавени. Допускат се най-много 3 прикачени файла; съществуващите са запазени.',
    );
    const trigger = cell.getByRole('button', { name: message, exact: true });
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await trigger.evaluate((element) => element.scrollIntoView({ block: 'center' }));
    await trigger.click();
    const popupRoot = webcomponent ? page.locator(`jsonforms-svelte-${family}`) : page;
    const popup = popupRoot
      .locator(
        '[role="dialog"]:visible, [role="tooltip"]:visible, [data-slot="popover-content"]:visible, [data-scope="popover"][data-part="content"]:visible',
      )
      .filter({ hasText: message })
      .last();
    await popup.waitFor();
    const state = await popup.evaluate(async (element) => {
      const surface = [element, ...element.querySelectorAll('*')].find(
        (node) => getComputedStyle(node).overflowY === 'auto',
      );
      if (!surface) return null;
      // Stretch the rendered production surface to cover unusually long localized feedback.
      const last = document.createElement('div');
      last.textContent = ` ${'long feedback '.repeat(100)} final feedback`;
      surface.append(last);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      surface.scrollTop = surface.scrollHeight;
      const popupBounds = element.getBoundingClientRect();
      const surfaceBounds = surface.getBoundingClientRect();
      const lastBounds = last.getBoundingClientRect();
      return {
        top: popupBounds.top,
        bottom: popupBounds.bottom,
        scrollHeight: surface.scrollHeight,
        clientHeight: surface.clientHeight,
        lastVisible: lastBounds.bottom <= surfaceBounds.bottom,
        rootIsShadow: element.getRootNode() instanceof ShadowRoot,
      };
    });
    expect(state).not.toBeNull();
    expect(state!.rootIsShadow).toBe(webcomponent);
    await expect
      .poll(async () => {
        const bounds = await popup.boundingBox();
        return bounds && { top: bounds.y >= 0, bottom: bounds.y + bounds.height <= 450 };
      })
      .toEqual({ top: true, bottom: true });
    expect(state!.scrollHeight).toBeGreaterThan(state!.clientHeight);
    expect(state!.lastVisible).toBe(true);
    expect(errors).toEqual([]);
  },
  { timeout: 30_000 },
);
