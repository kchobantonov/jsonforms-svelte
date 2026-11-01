import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'webcomponent-file-feedback-overlays',
  async ({ page, family, locale, base }) => {
    const text = (en: string, bg: string) => (locale === 'bg' ? bg : en);
    await page.addInitScript(
      ({ family, locale }) => localStorage.setItem(`${family}-example-locale`, locale),
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
    const popupText = page.getByText(message, { exact: true }).filter({ visible: true }).last();
    await page.getByRole('dialog').waitFor({ state: 'hidden' });
    await page.getByRole('tab', { name: 'AG Grid', exact: true }).focus();
    await trigger.press('Enter');
    if (family === 'flowbite')
      await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('true');
    await popupText.waitFor();
    await page.keyboard.press('Escape');
    if (family === 'flowbite')
      await expect.poll(() => trigger.getAttribute('aria-expanded')).toBe('false');
    await popupText.waitFor({ state: 'hidden' });
    await trigger.click();
    await popupText.waitFor();
    expect(await popupText.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    const bounds = await popupText.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1440);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1000);
    await expect
      .poll(() =>
        popupText.evaluate((element) => {
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
