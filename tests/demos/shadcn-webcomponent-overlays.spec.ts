import { expect } from 'vite-plus/test';
import { demoTest } from '../helpers/demo';
import messages from '../../packages/jsonforms-svelte/src/lib/locales/messages.json';

demoTest(
  'shadcn-webcomponent-overlays',
  async ({ page, family, locale, webcomponent, base }) => {
    if (!webcomponent) return;
    await page.addInitScript(
      ({ family, locale }) =>
        localStorage.setItem(
          `${family}-example-locale`,
          JSON.stringify({ version: 1, value: locale }),
        ),
      { family, locale },
    );
    await page.goto(
      `${base}/${family}/#/examples/spec-additional-properties?use-webcomponent=true&drawer=true`,
    );

    const marker = page
      .locator('.property-name-invalid')
      .filter({ hasText: 'sensor-x' })
      .getByRole('button', { name: messages[locale]['validation.errors'] });
    await marker.hover();
    const popup = page.locator('[data-slot="popover-content"]:visible');
    await popup.waitFor();

    // A wide validation popup near the form's inline end must remain visible.
    await popup.evaluate((element) => {
      (element as HTMLElement).style.minWidth = '460px';
    });
    await expect
      .poll(async () => {
        const popupBox = await popup.boundingBox();
        const markerBox = await marker.boundingBox();
        return (
          !!popupBox &&
          !!markerBox &&
          popupBox.width >= 400 &&
          popupBox.x >= 0 &&
          popupBox.x < markerBox.x &&
          popupBox.x + popupBox.width <= 1441
        );
      })
      .toBe(true);
    await expect
      .poll(() =>
        popup.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const x = box.left + 8;
          const y = box.top + box.height / 2;
          let hit: Element | null = document.elementFromPoint(x, y);
          while (hit?.shadowRoot) hit = hit.shadowRoot.elementFromPoint(x, y);
          return !!hit && element.contains(hit);
        }),
      )
      .toBe(true);
    expect(await popup.evaluate((element) => element.getRootNode() instanceof ShadowRoot)).toBe(
      true,
    );
    const popupStyle = await popup.evaluate((element) => {
      const style = getComputedStyle(element);
      return { background: style.backgroundColor, color: style.color, padding: style.paddingTop };
    });
    expect(popupStyle.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(popupStyle.color).not.toBe('');
    expect(Number.parseFloat(popupStyle.padding)).toBeGreaterThan(0);

    await page.goto(
      `${base}/${family}/#/examples/spec-temporal-controls?use-webcomponent=true&drawer=true`,
    );
    for (const kind of ['date', 'datetime'] as const) {
      const scope = `#/properties/schemaBased/properties/${kind}`;
      const trigger = page.locator(`[id=${JSON.stringify(scope)}]`).getByRole('button', {
        name: messages[locale][kind === 'date' ? 'temporal.chooseDate' : 'temporal.chooseDateTime'],
        exact: true,
      });
      await trigger.click();
      const calendar = page.getByRole('application', {
        name: new RegExp(messages[locale]['calendar.name']),
      });
      await calendar.waitFor();
      expect(
        await calendar.evaluate((element) => element.getRootNode() instanceof ShadowRoot),
      ).toBe(true);
      await expect
        .poll(() =>
          calendar.evaluate((element) => {
            const root = element.getRootNode();
            return root instanceof ShadowRoot && element.contains(root.activeElement);
          }),
        )
        .toBe(true);
      const bounds = await calendar.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.y).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(1440);
      expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(1000);
      await page.keyboard.press('Escape');
      await calendar.waitFor({ state: 'hidden' });
      await expect.poll(() => trigger.evaluate((element) => element.matches(':focus'))).toBe(true);
    }
  },
  { families: ['shadcn'] },
);
