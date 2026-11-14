import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import { applyDemoEditor } from '../helpers/demo-editor';

demoTest(
  'long checkbox label narrow',
  async ({ page, base, family, webcomponent }) => {
    await page.addInitScript(
      (family) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: 'bg' }),
        ),
      family,
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-boolean-controls?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const title = 'Потвърждавам, че прочетох и разбрах дългите условия за тази заявка';
    await applyDemoEditor(
      page,
      'bg',
      'Schema',
      { type: 'object', properties: { consent: { type: 'boolean', title } } },
      { verifyVisibleText: false },
    );
    await applyDemoEditor(
      page,
      'bg',
      'UI Schema',
      { type: 'Control', scope: '#/properties/consent', label: title },
      { verifyVisibleText: false },
    );
    const demoTab = page.getByRole('tab', { name: /^Демонстрация/ });
    await demoTab.click();
    await expect.poll(() => demoTab.getAttribute('aria-selected')).toBe('true');
    await page.setViewportSize({ width: 320, height: 850 });
    const label = page.getByText(title, { exact: true });
    await expect.poll(() => label.isVisible()).toBe(true);
    const bounds = await label.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.height).toBeGreaterThan(20);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
    expect(await label.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    const checkbox = page.locator('[id="#/properties/consent-input"]');
    await label.click();
    await expect.poll(() => checkbox.isChecked()).toBe(true);
    expect(errors).toEqual([]);
  },
  { locales: ['bg'], timeout: 20_000 },
);
