import { describe, expect, it } from 'vitest';
import {
  durationControlRendererEntry,
  extendedControlRenderers,
  fileControlRendererEntry,
  nullControlRendererEntry,
} from '../src/lib/controls';
import { extendedLayoutRenderers, splitLayoutRendererEntry } from '../src/lib/layouts';
import { flowbiteExtendedRenderers } from '../src/lib/renderers';

describe('renderers exports', () => {
  it('re-exports control and layout entries via flowbiteExtendedRenderers', () => {
    expect(flowbiteExtendedRenderers).toHaveLength(4);
    expect(flowbiteExtendedRenderers).toContain(durationControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(fileControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(nullControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(splitLayoutRendererEntry);
    expect(flowbiteExtendedRenderers).toEqual([
      ...extendedControlRenderers,
      ...extendedLayoutRenderers,
    ]);
  });
});
