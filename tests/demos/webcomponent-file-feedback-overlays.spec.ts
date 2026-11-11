import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'webcomponent-file-feedback-overlays',
  async ({ page, family, locale, base }) => {
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
    await page.goto(
      `${base}/${family}/#/examples/spec-file-control?use-webcomponent=true&drawer=false`,
    );
    await page
      .getByRole('tab', { name: text('Table cells', 'Клетки в таблица'), exact: true })
      .click();
    await page.getByRole('tab', { name: 'AG Grid', exact: true }).click();
    const input = page.locator('.ag-root:visible input[type="file"][multiple]').first();
    const cell = input.locator('xpath=ancestor::*[@data-file-control][1]');
    await input.setInputFiles({
      name: 'third.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('third'),
    });
    await cell.getByText('third.txt', { exact: true }).waitFor();
    await input.setInputFiles({
      name: 'excess.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('excess'),
    });
    const message = text(
      'These files were not added. A maximum of 3 attachments is allowed; existing files were kept.',
      'Файловете не са добавени. Допускат се най-много 3 прикачени файла; съществуващите са запазени.',
    );
    const trigger = cell.getByRole('button', { name: message, exact: true });
    const popup = (family === 'flowbite' ? cell : page)
      .locator(
        '[role="dialog"]:visible, [role="tooltip"]:visible, [data-slot="popover-content"]:visible, [data-scope="popover"][data-part="content"]:visible',
      )
      .filter({ hasText: message })
      .last();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('tab', { name: 'AG Grid', exact: true }).focus();
    await trigger.press('Enter');
    if (family === 'flowbite')
      await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true');
    await popup.waitFor();
    await page.keyboard.press('Escape');
    if (family === 'flowbite')
      await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false');
    await popup.waitFor({ state: 'hidden' });
    await trigger.click();
    if (family === 'flowbite')
      await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true');
    await popup.waitFor();
    expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    expect(await popup.evaluate((element) => getComputedStyle(element).backgroundColor)).not.toBe(
      'rgba(0, 0, 0, 0)',
    );
    const bounds = await popup.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1440);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1000);
    await expect
      .poll(() =>
        popup.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          let hit: Element | null = document.elementFromPoint(x, y);
          while (hit?.shadowRoot) hit = hit.shadowRoot.elementFromPoint(x, y);
          return !!hit && element.contains(hit);
        }),
      )
      .toBe(true);
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
