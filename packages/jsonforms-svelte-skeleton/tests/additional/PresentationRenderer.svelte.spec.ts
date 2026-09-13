import { RuleEffect } from '@jsonforms/core';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from 'vitest-browser-svelte';
import { additionalRenderers } from '../../src/lib/additional';
import { mountForm } from '../testUtils';
afterEach(cleanup);
describe('presentation renderers', () => {
  it('renders a separator', () => {
    const { view } = mountForm({
      schema: {},
      uischema: { type: 'Separator' },
      renderers: additionalRenderers,
    });
    expect(view.container.querySelector('hr, [data-slot="separator"]')).not.toBeNull();
  });
  it('uses default and explicit spacer heights', () => {
    const first = mountForm({
      schema: {},
      uischema: { type: 'Spacer' },
      renderers: additionalRenderers,
    });
    expect(first.view.container.querySelector('[style*="height: 32px"]')).not.toBeNull();
    const second = mountForm({
      schema: {},
      uischema: { type: 'Spacer', options: { height: 64 } },
      renderers: additionalRenderers,
    });
    expect(second.view.container.querySelector('[style*="height: 64px"]')).not.toBeNull();
  });
  it('uses image source and alternative text and honors visibility rules', () => {
    const { view } = mountForm({
      schema: {},
      uischema: {
        type: 'ImageView',
        options: { src: '/example.png', alt: 'Example illustration' },
      },
      renderers: additionalRenderers,
    });
    expect(view.container.querySelector('img')?.getAttribute('src')).toBe('/example.png');
    expect(view.container.querySelector('img')?.getAttribute('alt')).toBe('Example illustration');
    const hidden = mountForm({
      schema: {},
      data: {},
      uischema: {
        type: 'ImageView',
        options: { src: '/example.png' },
        rule: { effect: RuleEffect.HIDE, condition: { scope: '#', schema: {} } },
      },
      renderers: additionalRenderers,
    });
    expect(hidden.view.container.querySelector('img')).toBeNull();
  });
});
