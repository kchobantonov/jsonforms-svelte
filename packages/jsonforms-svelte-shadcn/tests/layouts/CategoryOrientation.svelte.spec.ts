import '../test.css';
import { JsonForms } from '@chobantonov/jsonforms-svelte';
import type { UISchemaElement } from '@jsonforms/core';
import { render, cleanup } from 'vitest-browser-svelte';
import { afterEach, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { shadcnRenderers, shadcnCells } from '../../src/lib';

afterEach(cleanup);
const category = (name: string) => ({ type: 'Category', name, label: name, elements: [] });
it.each([false, true])(
  'keeps native tabs oriented and keyboard operable: vertical=%s',
  async (vertical) => {
    render(JsonForms, {
      props: {
        schema: {},
        data: {},
        renderers: shadcnRenderers,
        cells: shadcnCells,
        uischema: {
          type: 'Categorization',
          options: { vertical },
          elements: [category('First'), category('Second')],
        } as UISchemaElement,
      },
    });
    const first = page.getByRole('tab', { name: 'First', exact: true });
    const second = page.getByRole('tab', { name: 'Second', exact: true });
    await expect.element(first).toHaveAttribute('tabindex', '0');
    await expect.element(second).toHaveAttribute('tabindex', '-1');
    await expect
      .element(page.getByRole('tablist'))
      .toHaveAttribute('aria-orientation', vertical ? 'vertical' : 'horizontal');
    const firstBounds = first.element().getBoundingClientRect();
    const secondBounds = second.element().getBoundingClientRect();
    expect(
      vertical ? secondBounds.top > firstBounds.top : secondBounds.left > firstBounds.left,
    ).toBe(true);
    await first.click();
    await userEvent.keyboard(vertical ? '{ArrowDown}' : '{ArrowRight}');
    await expect.element(second).toHaveAttribute('aria-selected', 'true');
    await expect.element(second).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect.element(first).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}');
    await expect.element(second).toHaveFocus();
    await expect.element(second).toHaveAttribute('aria-selected', 'true');
    await expect
      .element(page.getByRole('tabpanel'))
      .toHaveAttribute('aria-labelledby', second.element().id);
  },
);
it('gives repeated category names unique tab IDs in independent layouts', async () => {
  const layout = { type: 'Categorization', elements: [category('First'), category('Second')] };
  const view = render(JsonForms, {
    props: {
      schema: {},
      data: {},
      renderers: shadcnRenderers,
      cells: shadcnCells,
      uischema: {
        type: 'VerticalLayout',
        elements: [layout, structuredClone(layout)],
      } as UISchemaElement,
    },
  });
  await expect.poll(() => view.container.querySelectorAll('[role="tab"]').length).toBe(4);
  const tabs = Array.from(view.container.querySelectorAll('[role="tab"]'));
  expect(new Set(tabs.map((tab) => tab.id)).size).toBe(4);
  for (const panel of view.container.querySelectorAll('[role="tabpanel"]')) {
    expect(tabs.filter((tab) => tab.id === panel.getAttribute('aria-labelledby'))).toHaveLength(1);
  }
});
