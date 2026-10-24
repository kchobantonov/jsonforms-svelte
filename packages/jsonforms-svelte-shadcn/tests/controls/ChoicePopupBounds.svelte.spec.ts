import '../test.css';
import { afterEach, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { cleanup } from 'vitest-browser-svelte';
import { shadcnRenderers, shadcnCells } from '../../src/lib';
import { mountControl } from '../testUtils';

afterEach(async () => {
  await cleanup();
  await page.viewport(1280, 720);
});

const choices = Array.from({ length: 100 }, (_, index) => `Option ${index}`);

for (const [width, height] of [
  [360, 260],
  [1280, 720],
]) {
  for (const locale of ['en', 'bg']) {
    for (const multiple of [false, true]) {
      it(`keeps ${multiple ? 'multiple' : 'searchable'} choices inside ${width}×${height} (${locale}) with the last option reachable`, async () => {
        await page.viewport(width, height);
        const { onchange } = await mountControl({
          renderers: shadcnRenderers,
          cells: shadcnCells,
          i18n: { locale },
          propertySchema: multiple
            ? {
                type: 'array',
                title: 'Choices',
                items: { type: 'string', enum: choices },
                uniqueItems: true,
              }
            : { type: 'string', title: 'Choices', enum: choices },
          options: { autocomplete: true, ...(multiple ? { variant: 'multi-select' } : {}) },
        });
        await page
          .getByRole(multiple ? 'button' : 'combobox', { name: 'Choices', exact: true })
          .click();
        const popup = document.querySelector<HTMLElement>('[data-slot="popover-content"]')!;
        await expect.poll(() => popup.getBoundingClientRect().bottom).toBeLessThanOrEqual(height);
        expect(popup.getBoundingClientRect().top).toBeGreaterThanOrEqual(0);
        const list = popup.querySelector<HTMLElement>(
          multiple ? '[role="group"]' : '[data-slot="command-list"]',
        )!;
        expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);
        const search = page.getByRole('textbox', {
          name: locale === 'bg' ? 'Търсене на опции' : 'Search choices',
        });
        expect(popup.getBoundingClientRect().height).toBeLessThanOrEqual(320);
        expect(onchange.mock.lastCall?.[0].data.value).toBeUndefined();
        // Keyboard navigation must scroll the list, while the search remains visible.
        if (multiple) {
          await search.click();
          await userEvent.keyboard('{Tab}'.repeat(100));
          const focused = document.activeElement!.getBoundingClientRect();
          expect(focused.top).toBeGreaterThanOrEqual(list.getBoundingClientRect().top);
          expect(focused.bottom).toBeLessThanOrEqual(list.getBoundingClientRect().bottom + 1);
          await userEvent.keyboard(' ');
        } else {
          await userEvent.keyboard('{End}{Enter}');
        }
        await expect
          .poll(() => onchange.mock.lastCall?.[0].data.value)
          .toEqual(multiple ? ['Option 99'] : 'Option 99');
        if (multiple) {
          expect(list.scrollTop).toBeGreaterThan(0);
          const rect = search.element().getBoundingClientRect();
          expect(rect.top).toBeGreaterThanOrEqual(popup.getBoundingClientRect().top);
          expect(rect.bottom).toBeLessThanOrEqual(height);
        }
      });
    }
  }
}
