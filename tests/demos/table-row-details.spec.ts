import assert from 'node:assert/strict';
import { expect } from 'vite-plus/test';
import type { Locator } from 'playwright';
import { demoTest } from '../helpers/demo';
import translations from '../../packages/jsonforms-svelte-demo-common/src/lib/examples/spec-table-row-details/translations.supplement.json';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'table-row-details',
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
      `${base}/${family}/#/examples/spec-table-row-details?use-webcomponent=${webcomponent}&drawer=false`,
    );
    const applicantSummary = (index: number) =>
      translations[locale]['applicants.applicantSummary.text']
        .replace('{name}', `Applicant ${String(index).padStart(2, '0')}`)
        .replace('{email}', `applicant${index}@example.com`);
    const sortedSummaries = Array.from({ length: 12 }, (_, index) =>
      applicantSummary(index + 1),
    ).sort();
    await expect
      .poll(() => page.getByText(applicantSummary(1), { exact: true }).first().isVisible())
      .toBe(true);
    const notes = page.getByRole('textbox', {
      name: translations[locale]['detailExample.notes.label'],
      exact: true,
    });
    const categoryName = (label: string) =>
      new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`);
    const exerciseGeometry = async (surface: Locator, expectedWidth: number) => {
      await expect
        .poll(async () => Math.round((await surface.boundingBox())!.width))
        .toBe(expectedWidth);
      const initial = await surface.boundingBox();
      const header = await surface.locator('[data-detail-dialog-header]').boundingBox();
      assert.ok(initial && header);
      await page.mouse.move(header.x + 80, header.y + header.height / 2);
      await page.mouse.down();
      await page.mouse.move(header.x, header.y + header.height / 2 - 30, { steps: 8 });
      await page.mouse.up();
      await expect
        .poll(async () => Math.round((await surface.boundingBox())!.x))
        .toBe(Math.round(initial.x - 80));
      const moved = (await surface.boundingBox())!;
      await page.mouse.move(moved.x + moved.width - 3, moved.y + moved.height - 3);
      await page.mouse.down();
      await page.mouse.move(moved.x + moved.width + 37, moved.y + moved.height + 27, { steps: 8 });
      await page.mouse.up();
      await expect
        .poll(async () => (await surface.boundingBox())!.width)
        .toBeGreaterThan(moved.width + 10);
      const resized = (await surface.boundingBox())!;
      const maximize = surface.getByRole('button', {
        name: messages[locale]['dialog.maximize'],
        exact: true,
      });
      await maximize.focus();
      const hint = surface
        .locator('[role="tooltip"]')
        .filter({ hasText: messages[locale]['dialog.maximize'] })
        .first();
      await expect
        .poll(() => hint.evaluate((node) => getComputedStyle(node).visibility))
        .toBe('visible');
      expect(await hint.evaluate((node) => node.getRootNode() instanceof ShadowRoot)).toBe(
        webcomponent,
      );
      expect(await hint.evaluate((node) => getComputedStyle(node).backgroundColor)).not.toBe(
        'rgba(0, 0, 0, 0)',
      );
      await maximize.click();
      await expect.poll(async () => Math.round((await surface.boundingBox())!.height)).toBe(968);
      await page
        .getByRole('button', { name: messages[locale]['dialog.restore'], exact: true })
        .click();
      await expect
        .poll(async () => Math.round((await surface.boundingBox())!.width))
        .toBe(Math.round(resized.width));
      // Bounds use the resized surface, including its centering transform.
      let dragHeader = (await surface.locator('[data-detail-dialog-header]').boundingBox())!;
      await page.mouse.move(dragHeader.x + 80, dragHeader.y + dragHeader.height / 2);
      await page.mouse.down();
      await page.mouse.move(0, 0, { steps: 8 });
      await page.mouse.up();
      await expect.poll(async () => Math.round((await surface.boundingBox())!.x)).toBe(0);
      await expect.poll(async () => Math.round((await surface.boundingBox())!.y)).toBe(0);
      dragHeader = (await surface.locator('[data-detail-dialog-header]').boundingBox())!;
      await page.mouse.move(dragHeader.x + 80, dragHeader.y + dragHeader.height / 2);
      await page.mouse.down();
      await page.mouse.move(1440, 1000, { steps: 8 });
      await page.mouse.up();
      await expect
        .poll(async () => {
          const rect = (await surface.boundingBox())!;
          return [Math.round(rect.x + rect.width), Math.round(rect.y + rect.height)];
        })
        .toEqual([1440, 1000]);
      await page.setViewportSize({ width: 600, height: 450 });
      await expect
        .poll(async () => {
          const rect = (await surface.boundingBox())!;
          return (
            rect.x >= -1 &&
            rect.y >= -1 &&
            rect.x + rect.width <= 601 &&
            rect.y + rect.height <= 451
          );
        })
        .toBe(true);
      const viewportHeader = (await surface.locator('[data-detail-dialog-header]').boundingBox())!;
      const footer = (await surface.locator('[data-detail-dialog-footer]').boundingBox())!;
      assert.ok(viewportHeader.y >= 0 && viewportHeader.y + viewportHeader.height <= 451);
      assert.ok(footer.y >= 0 && footer.y + footer.height <= 451);
      await page.setViewportSize({ width: 1440, height: 1000 });
    };
    for (const mode of [
      'dialog',
      'side_panel',
      'bottom_panel',
      'ag_grid_dialog',
      'ag_grid_side_panel',
      'ag_grid_bottom_panel',
    ] as const) {
      await page
        .getByRole('tab', { name: categoryName(translations[locale][`rowDetails.${mode}.label`]) })
        .click();
      const modePanel = page.getByRole('tabpanel', {
        name: categoryName(translations[locale][`rowDetails.${mode}.label`]),
      });
      if (mode === 'ag_grid_dialog') {
        const heading = modePanel.locator(
          '.ag-header-cell[col-id="applicantSummary"] .ag-header-cell-text',
        );
        const firstSummary = modePanel.locator(
          '.ag-row[row-index="0"] [col-id="applicantSummary"]',
        );
        await heading.click();
        await heading.click();
        await expect.poll(() => firstSummary.textContent()).toContain(sortedSummaries.at(-1)!);
        await heading.click();
        await expect.poll(() => firstSummary.textContent()).toContain(applicantSummary(1));
      }
      await modePanel
        .getByRole('button', {
          name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
          exact: true,
        })
        .first()
        .click();
      await notes.fill(`Edited ${mode}`);
      if (mode === 'dialog') {
        await exerciseGeometry(page.getByRole('dialog'), 900);
        assert.equal(await notes.inputValue(), `Edited ${mode}`);
      }

      if (mode.endsWith('dialog')) {
        await page
          .getByRole('button', { name: messages[locale]['composite.apply'], exact: true })
          .click();
        await modePanel
          .getByRole('button', {
            name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
            exact: true,
          })
          .first()
          .click();
        assert.equal(await notes.inputValue(), `Edited ${mode}`);
        await page.getByRole('dialog').press('Escape');
        await expect
          .poll(
            () =>
              modePanel
                .getByRole('button', {
                  name: messages[locale]['collection.editRowDetails'].replace('{index}', '1'),
                  exact: true,
                })
                .first()
                .evaluate((element) => element.matches(':focus')),
            { timeout: 10_000 },
          )
          .toBe(true);
        if (mode === 'dialog') {
          const contactTrigger = modePanel
            .getByRole('button', {
              name: messages[locale]['composite.edit'].replace(
                '{label}',
                translations[locale]['detailExample.contact.label'],
              ),
              exact: true,
            })
            .first();
          await contactTrigger.click();
          const phone = page.getByRole('textbox', {
            name: translations[locale]['detailExample.phone.label'],
            exact: true,
          });
          const originalPhone = await phone.inputValue();
          await phone.fill('555-9999');
          await exerciseGeometry(page.getByRole('dialog'), 720);
          assert.equal(await phone.inputValue(), '555-9999');
          await page.getByRole('dialog').press('Escape');
          await expect
            .poll(() => contactTrigger.evaluate((node) => node.matches(':focus')))
            .toBe(true);
          await contactTrigger.click();
          assert.equal(await phone.inputValue(), originalPhone);
          await page
            .getByRole('button', { name: messages[locale]['composite.cancel'], exact: true })
            .click();
        }
      } else {
        const handle = page.getByRole('separator', {
          name: messages[locale]['collection.resizeDetails'],
          exact: true,
        });
        await handle.focus();
        const before = await handle.getAttribute('aria-valuenow');
        await handle.press(mode.endsWith('bottom_panel') ? 'ArrowDown' : 'ArrowRight');
        await expect.poll(() => handle.getAttribute('aria-valuenow')).not.toBe(before);
        const resized = await handle.getAttribute('aria-valuenow');
        if (family === 'shadcn') {
          const scroll = page.locator('[data-row-detail-scroll]:visible');
          const lastField = scroll.locator('input:visible, textarea:visible').last();
          await lastField.focus();
          const overflow = await scroll.evaluate((node) => {
            node.scrollTop = node.scrollHeight;
            return { height: node.clientHeight, content: node.scrollHeight, top: node.scrollTop };
          });
          if (overflow.content > overflow.height) assert.ok(overflow.top > 0);
          const fieldBounds = (await lastField.boundingBox())!;
          const scrollBounds = (await scroll.boundingBox())!;
          assert.ok(fieldBounds.y + fieldBounds.height <= scrollBounds.y + scrollBounds.height + 1);
          assert.equal(await scroll.evaluate((node) => getComputedStyle(node).overflowY), 'auto');
          const strip = page.locator('.category-tabs-scroll:visible').first();
          assert.equal(await strip.evaluate((node) => getComputedStyle(node).overflowY), 'hidden');
          if (locale === 'en' && webcomponent && mode.endsWith('bottom_panel'))
            await page.locator('[data-row-detail-panel]:visible').screenshot({
              path: `test-results/shadcn-${mode}-scroll.png`,
              animations: 'disabled',
            });
        }
        const hideDetails = page.getByRole('button', {
          name: messages[locale]['collection.hideDetails'],
          exact: true,
        });
        const actions = page.locator('[data-array-actions]:visible');
        if (await actions.count()) {
          const buttons = actions.locator('button');
          const bounds = await buttons.evaluateAll((items) =>
            items.map((item) => item.getBoundingClientRect().toJSON()),
          );
          for (let index = 1; index < bounds.length; index++) {
            assert.ok(bounds[index].x - bounds[index - 1].x - bounds[index - 1].width <= 12);
          }
        }
        assert.equal((await hideDetails.textContent())?.trim(), '');
        assert.equal(await hideDetails.locator('svg').count(), 1);
        if (family === 'skeleton') await hideDetails.focus();
        else await hideDetails.hover();
        const detailTooltip = page.locator(
          family === 'shadcn' ? '[data-tooltip-content]:visible' : '[role="tooltip"]:visible',
        );
        if (family === 'skeleton') {
          // The native tooltip content is mounted in a portal; its popup state
          // after resizing is transient. The component suite covers visibility.
          await expect
            .poll(() =>
              page
                .locator('[role="tooltip"]')
                .filter({ hasText: messages[locale]['collection.hideDetails'] })
                .count(),
            )
            .toBeGreaterThan(0);
        } else {
          await expect
            .poll(() =>
              detailTooltip
                .filter({ hasText: messages[locale]['collection.hideDetails'] })
                .isVisible(),
            )
            .toBe(true);
        }
        await hideDetails.click();
        await page
          .getByRole('button', { name: messages[locale]['collection.showDetails'], exact: true })
          .click();
        assert.equal(await notes.inputValue(), `Edited ${mode}`);
        assert.equal(await handle.getAttribute('aria-valuenow'), resized);
      }
    }
    assert.deepEqual(errors, []);
  },
  { timeout: 30_000 },
);
