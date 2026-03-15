import { describe, expect, it } from 'vitest';
import {
  buttonRendererEntry,
  durationControlRendererEntry,
  extendedControlRenderers,
  fileControlRendererEntry,
  nullControlRendererEntry,
} from '../src/lib/controls';
import {
  extendedLayoutRenderers,
  splitLayoutRendererEntry,
  templateLayoutRendererEntry,
} from '../src/lib/layouts';
import { flowbiteExtendedRenderers } from '../src/lib/renderers';

describe('renderers exports', () => {
  it('re-exports control and layout entries via flowbiteExtendedRenderers', () => {
    expect(flowbiteExtendedRenderers).toHaveLength(6);
    expect(flowbiteExtendedRenderers).toContain(buttonRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(durationControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(fileControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(nullControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(splitLayoutRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(templateLayoutRendererEntry);
    expect(flowbiteExtendedRenderers).toEqual([
      ...extendedControlRenderers,
      ...extendedLayoutRenderers,
    ]);
  });
});
