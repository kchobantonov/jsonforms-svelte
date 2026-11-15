import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte-demo-common/src/lib/components/demo-messages.json';
import rendererMessages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'native demo/data split follows direction and stacks narrowly',
  async ({ page, family, locale, base }) => {
    await page.addInitScript(
      ({ family, locale }) => {
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        );
        localStorage.setItem(
          `${family}-example-layout`,
          JSON.stringify({ version: 1, value: 'demo-and-data' }),
        );
      },
      { family, locale },
    );
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${base}/${family}/#/examples/spec-presentation?drawer=false`);
    const labels = messages[locale];
    const demo = page.getByRole('heading', { name: labels['editor.demo.label'], exact: true });
    const data = page.getByRole('heading', { name: labels['editor.data.label'], exact: true });
    const resizeName = rendererMessages[locale]['splitLayout.resize'];
    const handle = page.getByRole('separator', { name: resizeName, exact: true });
    await demo.waitFor();
    await data.waitFor();
    await handle.waitFor();

    const paneBox = async (heading: typeof demo) =>
      heading.evaluate((element) => {
        let pane = element as HTMLElement;
        while (
          pane.parentElement &&
          !pane.parentElement.matches('[data-split-group], [data-pane-group]')
        )
          pane = pane.parentElement;
        const { x, y, width, height } = pane.getBoundingClientRect();
        return { x, y, width, height };
      });
    const first = await paneBox(demo);
    const second = await paneBox(data);
    expect(first.x).toBeLessThan(second.x);
    expect(first.width / (first.width + second.width)).toBeGreaterThan(0.65);
    expect(first.width / (first.width + second.width)).toBeLessThan(0.85);
    const before = Number(await handle.getAttribute('aria-valuenow'));
    await handle.focus();
    await page.keyboard.press('ArrowRight');
    await expect
      .poll(async () => Number(await handle.getAttribute('aria-valuenow')))
      .not.toBe(before);

    const dragTo = async (fraction: number) => {
      const box = (await handle.boundingBox())!;
      const total = (await paneBox(demo)).width + (await paneBox(data)).width;
      const startX = box.x + box.width / 2;
      const targetX = first.x + total * fraction;
      const y = box.y + box.height / 2;
      await page.mouse.move(startX, y);
      await page.mouse.down();
      await page.mouse.move(targetX, y, { steps: 8 });
      await page.mouse.up();
    };
    await dragTo(0.4);
    await expect
      .poll(async () => (await paneBox(demo)).width < (await paneBox(data)).width)
      .toBe(true);
    await dragTo(0.85);
    await expect
      .poll(async () => (await paneBox(demo)).width > (await paneBox(data)).width)
      .toBe(true);
    await dragTo(0.01);
    expect((await paneBox(demo)).width).toBeGreaterThanOrEqual(190);
    await dragTo(0.99);
    expect((await paneBox(data)).width).toBeGreaterThanOrEqual(190);

    await page.getByRole('button', { name: labels['nav.openSettings'] }).click();
    await page.getByText('RTL', { exact: true }).click();
    await page.keyboard.press('Escape');
    await expect
      .poll(() => page.getByRole('button', { name: labels['nav.openSettings'] }).count())
      .toBe(1);
    const rtlFirst = await paneBox(demo);
    const rtlSecond = await paneBox(data);
    expect(rtlFirst.x).toBeGreaterThan(rtlSecond.x);
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => handle.isVisible()).toBe(false);
    const narrowFirst = await paneBox(demo);
    const narrowSecond = await paneBox(data);
    expect(narrowSecond.y).toBeGreaterThan(narrowFirst.y + 200);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth - innerWidth))
      .toBeLessThanOrEqual(2);
    expect(errors).toEqual([]);
  },
  { hosts: ['native'], timeout: 60_000 },
);
