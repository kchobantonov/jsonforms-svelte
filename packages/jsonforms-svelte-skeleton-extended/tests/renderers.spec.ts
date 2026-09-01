import { describe, expect, it } from 'vitest';
import {
  buttonRendererEntry,
  colorControlRendererEntry,
  durationControlRendererEntry,
  extendedControlRenderers,
  fileControlRendererEntry,
  nullControlRendererEntry,
  monacoControlRendererEntry,
  skeletonAgGridArrayRendererEntry,
} from '../src/lib/controls';
import {
  extendedLayoutRenderers,
  slotRendererEntry,
  splitLayoutRendererEntry,
  templateLayoutRendererEntry,
  templateRendererEntry,
} from '../src/lib/layouts';
import { skeletonExtendedRenderers } from '../src/lib/renderers';

describe('renderers exports', () => {
  it('re-exports control and layout entries via skeletonExtendedRenderers', () => {
    expect(skeletonExtendedRenderers).toHaveLength(11);
    expect(skeletonExtendedRenderers).toContain(buttonRendererEntry);
    expect(skeletonExtendedRenderers).toContain(colorControlRendererEntry);
    expect(skeletonExtendedRenderers).toContain(durationControlRendererEntry);
    expect(skeletonExtendedRenderers).toContain(fileControlRendererEntry);
    expect(skeletonExtendedRenderers).toContain(monacoControlRendererEntry);
    expect(skeletonExtendedRenderers).toContain(nullControlRendererEntry);
    expect(skeletonExtendedRenderers).toContain(skeletonAgGridArrayRendererEntry);
    expect(skeletonExtendedRenderers).toContain(splitLayoutRendererEntry);
    expect(skeletonExtendedRenderers).toContain(templateLayoutRendererEntry);
    expect(skeletonExtendedRenderers).toContain(templateRendererEntry);
    expect(skeletonExtendedRenderers).toContain(slotRendererEntry);
    expect(skeletonExtendedRenderers).toEqual([
      ...extendedControlRenderers,
      ...extendedLayoutRenderers,
    ]);
  });
});
