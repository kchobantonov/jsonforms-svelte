import { JsonForms } from '@chobantonov/jsonforms-svelte';
import { mount, unmount } from 'svelte';
import { expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { skeletonRenderers, skeletonCells } from '../../src/lib';
import { PortalTargetContextSymbol } from '../../src/lib/util';

it('keeps native disclosure state synchronized through repeated shadow-root toggles', async () => {
  const host = document.createElement('div');
  document.body.append(host);
  const shadow = host.attachShadow({ mode: 'open' });
  const target = document.createElement('div');
  shadow.append(target);
  const component = mount(JsonForms, {
    target,
    context: new Map([[PortalTargetContextSymbol, () => target]]),
    props: {
      schema: { type: 'object', properties: { name: { type: 'string' } } },
      data: { name: 'Ada' },
      uischema: {
        type: 'Group',
        label: 'Profile',
        options: { collapsible: true, collapsed: true },
        elements: [{ type: 'Control', scope: '#/properties/name' }],
      },
      renderers: skeletonRenderers,
      cells: skeletonCells,
    },
  });
  try {
    const trigger = page.getByRole('button', { name: 'Profile', exact: true });
    await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
    for (const expanded of [true, false, true, false]) {
      await trigger.click();
      await expect.element(trigger).toHaveAttribute('aria-expanded', String(expanded));
      const content = shadow.getElementById(trigger.element().getAttribute('aria-controls')!);
      expect(content?.hidden).toBe(!expanded);
    }
  } finally {
    await unmount(component);
    host.remove();
  }
});
