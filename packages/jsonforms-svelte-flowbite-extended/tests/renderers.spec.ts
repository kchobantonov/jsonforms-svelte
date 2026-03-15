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
  slotRendererEntry,
  splitLayoutRendererEntry,
  templateLayoutRendererEntry,
  templateRendererEntry,
} from '../src/lib/layouts';
import { flowbiteExtendedRenderers } from '../src/lib/renderers';

describe('renderers exports', () => {
  it('re-exports control and layout entries via flowbiteExtendedRenderers', () => {
    expect(flowbiteExtendedRenderers).toHaveLength(8);
    expect(flowbiteExtendedRenderers).toContain(buttonRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(durationControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(fileControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(nullControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(splitLayoutRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(templateLayoutRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(templateRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(slotRendererEntry);
    expect(flowbiteExtendedRenderers).toEqual([
      ...extendedControlRenderers,
      ...extendedLayoutRenderers,
    ]);
  });
});
