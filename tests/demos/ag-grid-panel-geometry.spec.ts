import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import uiSchema from '@chobantonov/jsonforms-extended-spec/examples/ag-grid/uischema.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'ag-grid-panel-geometry',
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
      `${base}/${family}/#/examples/spec-ag-grid?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const label = (index: number) => uiSchema.elements[index].label;

    await page.getByRole('tab', { name: label(2), exact: true }).click();
    const side = page.getByRole('tabpanel', { name: label(2), exact: true });
    await side.locator('.ag-row[row-index="0"]').click({ position: { x: 100, y: 12 } });
    const sideFrame = side.locator('[data-row-detail-panel="horizontal"]');
    await sideFrame.waitFor();
    const sideGrid = sideFrame.locator('.ag-root-wrapper');
    const sideDetail = sideFrame.locator('[data-row-detail-content]');
    const [gridBox, detailBox, frameBox] = await Promise.all([
      sideGrid.boundingBox(),
      sideDetail.boundingBox(),
      sideFrame.boundingBox(),
    ]);
    assert.ok(gridBox && detailBox && frameBox);
    assert.ok(detailBox.x >= gridBox.x + gridBox.width - 4, 'side detail follows the grid');
    assert.ok(detailBox.x + detailBox.width <= frameBox.x + frameBox.width + 4);
    assert.ok(Math.abs(detailBox.y - gridBox.y) < 40);
    const center = sideGrid.locator('.ag-body-horizontal-scroll-viewport');
    await expect
      .poll(() => center.evaluate((element) => element.scrollWidth - element.clientWidth))
      .toBeGreaterThan(20);
    assert.ok(
      (await center.evaluate((element) => {
        element.scrollLeft = element.scrollWidth;
        return element.scrollLeft;
      })) > 20,
      'the final columns are reachable through the grid scrollbar',
    );

    await page.getByRole('tab', { name: label(3), exact: true }).click();
    const bottom = page.getByRole('tabpanel', { name: label(3), exact: true });
    await bottom
      .getByRole('button', {
        name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
        exact: true,
      })
      .first()
      .click();
    const bottomFrame = bottom.locator('[data-row-detail-panel="vertical"]');
    await bottomFrame.waitFor();
    const [bottomGrid, bottomDetail, bottomBox] = await Promise.all([
      bottomFrame.locator('.ag-root-wrapper').boundingBox(),
      bottomFrame.locator('[data-row-detail-content]').boundingBox(),
      bottomFrame.boundingBox(),
    ]);
    assert.ok(bottomGrid && bottomDetail && bottomBox);
    assert.ok(bottomDetail.y >= bottomGrid.y + bottomGrid.height - 4);
    assert.ok(bottomDetail.y < bottomBox.y + bottomBox.height);
    assert.ok(Math.abs(bottomDetail.x - bottomGrid.x) < 40);
    assert.ok(
      await bottomFrame.locator('[data-row-detail-content]').evaluate((content) => {
        const frame = content.closest('[data-row-detail-panel]');
        for (let node = content.parentElement; node && node !== frame; node = node.parentElement) {
          if (['auto', 'scroll'].includes(getComputedStyle(node).overflowY)) return true;
        }
        return false;
      }),
      'long bottom detail content has a scrolling pane',
    );
    expect(errors).toEqual([]);
  },
  { timeout: 45_000 },
);
