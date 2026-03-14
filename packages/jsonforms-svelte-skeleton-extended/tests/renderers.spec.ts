import { describe, expect, it } from 'vitest';
import {
  durationControlRendererEntry,
  extendedControlRenderers,
  fileControlRendererEntry,
} from '../src/lib/controls';
import { skeletonExtendedRenderers } from '../src/lib/renderers';

describe('renderers exports', () => {
  it('re-exports control entries via skeletonExtendedRenderers', () => {
    expect(skeletonExtendedRenderers).toHaveLength(2);
    expect(skeletonExtendedRenderers).toContain(durationControlRendererEntry);
    expect(skeletonExtendedRenderers).toContain(fileControlRendererEntry);
    expect(skeletonExtendedRenderers).toEqual(extendedControlRenderers);
  });
});
