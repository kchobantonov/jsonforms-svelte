import { afterEach, expect, it, vi } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import type { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { entry as string } from '../../src/lib/controls/StringControlRenderer.entry';
import { entry as accordion } from '../../src/lib/layouts/CategorizationAccordionRenderer.entry';
import { entry as tabs } from '../../src/lib/layouts/CategorizationRenderer.entry';
import { entry as stepper } from '../../src/lib/layouts/CategorizationStepperRenderer.entry';
import { entry as layout } from '../../src/lib/layouts/LayoutRenderer.entry';
import { getButtonByText, getInputByLabel } from '../testUtils';
import CategoryRemovalHost from './CategoryRemovalHost.svelte';

afterEach(cleanup);

const schema = {
  type: 'object',
  properties: { name: { type: 'string', title: 'Name' } },
} as JsonSchema;
const renderers = [tabs, accordion, stepper, layout, string];

it.each(['tabs', 'accordion', 'stepper'])(
  'removes and restores a focused final %s Category through host updates',
  async (variant) => {
    const uischema = {
      type: 'Categorization',
      options: variant === 'tabs' ? {} : { variant },
      elements: [
        {
          type: 'Category',
          name: 'general',
          label: 'General',
          elements: [{ type: 'Control', scope: '#/properties/name' }],
        },
      ],
    } as UISchemaElement;
    const onchange = vi.fn();
    const view = await render(CategoryRemovalHost, {
      props: { schema, uischema, renderers, data: { name: 'Ada' }, onchange },
    });
    getButtonByText(view.container, 'General').focus();
    const changes = onchange.mock.calls.length;
    const [remove, restore] = view.container.querySelectorAll<HTMLButtonElement>('button');
    remove.click();
    await expect.poll(() => view.container.textContent?.includes('General')).toBe(false);
    expect(view.container.querySelector('input')).toBeNull();
    restore.click();
    await expect.poll(() => getInputByLabel(view.container, 'Name').value).toBe('Ada');
    expect(onchange.mock.calls).toHaveLength(changes);
  },
);
