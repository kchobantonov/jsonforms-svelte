import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import uiSchema from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/uischema.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'ag-grid-panel-narrow',
  async ({ page, family, locale, webcomponent, base }) => {
    assert.equal(webcomponent, true);
    await page.setViewportSize({ width: 390, height: 800 });
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
    await page.goto(`${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=true&drawer=false`);
    const label = (index: number) => uiSchema.elements[index].label;
    const host = page.locator(`jsonforms-svelte-${family}`);
    const contained = async (selector: string) => {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box);
      assert.ok(box.x >= -2 && box.x + box.width <= 392, JSON.stringify(box));
    };
    await page.getByRole('tab', { name: label(2), exact: true }).click();
    const side = page.getByRole('tabpanel', { name: label(2), exact: true });
    await side.locator('.ag-row[row-index="0"]').click({ position: { x: 45, y: 12 } });
    await contained('[data-row-detail-panel="horizontal"]');
    const detail = side.locator('[data-row-detail-content]');
    await expect
      .poll(() => detail.evaluate((element) => element.getBoundingClientRect().width))
      .toBeGreaterThan(250);
    assert.ok(
      await detail.evaluate((element) => {
        const frame = element.closest('[data-row-detail-panel]');
        for (let node = element.parentElement; node && node !== frame; node = node.parentElement) {
          if (
            ['auto', 'scroll'].includes(getComputedStyle(node).overflowX) &&
            node.scrollWidth > node.clientWidth + 20
          ) {
            node.scrollLeft = node.scrollWidth;
            const reached = node.scrollLeft > 20;
            node.scrollLeft = 0;
            return reached;
          }
        }
        return false;
      }),
      'the detail fields remain readable through their own horizontal scroll pane',
    );
    await expect
      .poll(() =>
        side
          .locator('.ag-body-horizontal-scroll-viewport')
          .evaluate((element) => element.scrollWidth - element.clientWidth),
      )
      .toBeGreaterThan(20);
    await mkdir('test-results', { recursive: true });
    for (const mode of ['light', 'dark']) {
      await host.evaluate((element, value) => {
        (element as HTMLElement & { mode: string }).mode = value;
      }, mode);
      await expect.poll(() => host.getAttribute('data-mode')).toBe(mode);
      await side.locator('[data-row-detail-content]').waitFor();
      await host.screenshot({
        path: `test-results/ag-grid-side-${family}-${locale}-${mode}-narrow.png`,
        animations: 'disabled',
      });
    }
    await page.getByRole('tab', { name: label(3), exact: true }).click();
    const bottom = page.getByRole('tabpanel', { name: label(3), exact: true });
    await bottom
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .first()
      .click();
    await contained('[data-row-detail-panel="vertical"]');
    await host.screenshot({
      path: `test-results/ag-grid-bottom-${family}-${locale}-dark-narrow.png`,
      animations: 'disabled',
    });
    expect(errors).toEqual([]);
  },
  { hosts: ['webcomponent'], timeout: 45_000 },
);
