import { describe, expect, it } from 'vitest';
import {
  durationControlRendererEntry,
  extendedControlRenderers,
  fileControlRendererEntry,
  nullControlRendererEntry,
} from '../src/lib/controls';
import { extendedLayoutRenderers, splitLayoutRendererEntry } from '../src/lib/layouts';
import { skeletonExtendedRenderers } from '../src/lib/renderers';

describe('renderers exports', () => {
  it('re-exports control and layout entries via skeletonExtendedRenderers', () => {
    expect(skeletonExtendedRenderers).toHaveLength(4);
    expect(skeletonExtendedRenderers).toContain(durationControlRendererEntry);
    expect(skeletonExtendedRenderers).toContain(fileControlRendererEntry);
    expect(skeletonExtendedRenderers).toContain(nullControlRendererEntry);
    expect(skeletonExtendedRenderers).toContain(splitLayoutRendererEntry);
    expect(skeletonExtendedRenderers).toEqual([
      ...extendedControlRenderers,
      ...extendedLayoutRenderers,
    ]);
  });
});
