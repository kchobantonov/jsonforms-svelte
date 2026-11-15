import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';

demoTest(
  'file long name narrow',
  async ({ page, base, family, webcomponent }) => {
    await page.setViewportSize({ width: 320, height: 850 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(
      `${base}/${family}/#/examples/spec-file-control?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const field = page.locator('[data-file-control]:visible').first();
    const name = `${'long-attachment-name-'.repeat(5)}.txt`;
    await field.locator('input[type="file"]').setInputFiles({
      name,
      mimeType: 'text/plain',
      buffer: Buffer.from('file'),
    });
    const filename = field.getByTitle(name);
    await expect.poll(() => filename.isVisible()).toBe(true);
    await filename.focus();
    const remove = field.getByRole('button', { name: `Remove file: ${name}` });
    await expect.poll(() => remove.isVisible()).toBe(true);
    const [fieldBox, nameBox, removeBox] = await Promise.all([
      field.boundingBox(),
      filename.boundingBox(),
      remove.boundingBox(),
    ]);
    expect(fieldBox).not.toBeNull();
    expect(nameBox).not.toBeNull();
    expect(removeBox).not.toBeNull();
    expect(nameBox!.x).toBeGreaterThanOrEqual(fieldBox!.x);
    expect(nameBox!.x + nameBox!.width).toBeLessThanOrEqual(fieldBox!.x + fieldBox!.width);
    expect(removeBox!.x + removeBox!.width).toBeLessThanOrEqual(fieldBox!.x + fieldBox!.width);
    expect(await filename.getAttribute('title')).toBe(name);
    expect(errors).toEqual([]);
  },
  { locales: ['en'] },
);
