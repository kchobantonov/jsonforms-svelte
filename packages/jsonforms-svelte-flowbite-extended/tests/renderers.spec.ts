import { describe, expect, it } from 'vitest';
import {
  durationControlRendererEntry,
  extendedControlRenderers,
  fileControlRendererEntry,
} from '../src/lib/controls';
import { flowbiteExtendedRenderers } from '../src/lib/renderers';

describe('renderers exports', () => {
  it('re-exports control entries via flowbiteExtendedRenderers', () => {
    expect(flowbiteExtendedRenderers).toHaveLength(2);
    expect(flowbiteExtendedRenderers).toContain(durationControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(fileControlRendererEntry);
    expect(flowbiteExtendedRenderers).toEqual(extendedControlRenderers);
  });
});
