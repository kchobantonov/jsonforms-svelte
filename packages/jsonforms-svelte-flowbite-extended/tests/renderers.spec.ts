import { describe, expect, it } from 'vitest';
import {
  buttonRendererEntry,
  colorControlRendererEntry,
  durationControlRendererEntry,
  extendedControlRenderers,
  fileControlRendererEntry,
  nullControlRendererEntry,
  monacoControlRendererEntry,
  flowbiteAgGridArrayRendererEntry,
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
    expect(flowbiteExtendedRenderers).toHaveLength(11);
    expect(flowbiteExtendedRenderers).toContain(buttonRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(colorControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(durationControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(fileControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(monacoControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(nullControlRendererEntry);
    expect(flowbiteExtendedRenderers).toContain(flowbiteAgGridArrayRendererEntry);
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
