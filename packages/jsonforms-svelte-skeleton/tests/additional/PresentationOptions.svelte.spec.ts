import { clearAllIds, type UISchemaElement } from '@jsonforms/core';
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test';
import { cleanup } from 'vitest-browser-svelte';
import { entry as imageEntry } from '../../src/lib/additional/ImageViewRenderer.entry';
import { entry as separatorEntry } from '../../src/lib/additional/SeparatorRenderer.entry';
import { mountForm } from '../testUtils';

describe('ImageView and Separator local options', () => {
  beforeEach(() => clearAllIds());
  afterEach(cleanup);

  it('sizes the image from local width and height, including zero, and ignores invalid values', async () => {
    const element = (width: unknown, height: unknown): UISchemaElement =>
      ({
        type: 'ImageView',
        src: '/preview.png',
        alt: 'Preview',
        options: { width, height },
      }) as UISchemaElement;
    const { view } = await mountForm({
      schema: { type: 'object' },
      renderers: [imageEntry],
      uischema: element(120, '5rem'),
      config: { width: 300, height: 300 },
    });
    const image = view.container.querySelector<HTMLImageElement>('img[alt="Preview"]')!;
    expect(image.style.width).toBe('120px');
    expect(image.style.height).toBe('5rem');
    await view.rerender({ uischema: element('30%', 0) });
    expect(image.style.width).toBe('30%');
    expect(image.style.height).toBe('0px');
    await view.rerender({ uischema: element(-1, 'not-a-dimension') });
    expect(image.style.width).toBe('');
    expect(image.style.height).toBe('');
  });

  it('orients the separator only from its local option, ignoring removed flat vertical', async () => {
    const element = (vertical?: boolean): UISchemaElement =>
      ({
        type: 'Separator',
        options: vertical === undefined ? {} : { vertical },
      }) as UISchemaElement;
    const { view } = await mountForm({
      schema: { type: 'object' },
      renderers: [separatorEntry],
      uischema: element(true),
      config: { vertical: false },
    });
    const orientation = () =>
      view.container.querySelector('[role="separator"], hr')?.getAttribute('aria-orientation');
    expect(orientation()).toBe('vertical');
    await view.rerender({ uischema: element(false), config: { vertical: true } });
    expect(orientation()).toBe('horizontal');
    await view.rerender({ uischema: element(), config: { vertical: true } });
    expect(orientation()).toBe('horizontal');
  });
});
