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
import { shadcnExtendedRenderers } from '../src/lib/renderers';

describe('renderers exports', () => {
  it('re-exports control and layout entries via shadcnExtendedRenderers', () => {
    expect(shadcnExtendedRenderers).toHaveLength(8);
    expect(shadcnExtendedRenderers).toContain(buttonRendererEntry);
    expect(shadcnExtendedRenderers).toContain(durationControlRendererEntry);
    expect(shadcnExtendedRenderers).toContain(fileControlRendererEntry);
    expect(shadcnExtendedRenderers).toContain(nullControlRendererEntry);
    expect(shadcnExtendedRenderers).toContain(splitLayoutRendererEntry);
    expect(shadcnExtendedRenderers).toContain(templateLayoutRendererEntry);
    expect(shadcnExtendedRenderers).toContain(templateRendererEntry);
    expect(shadcnExtendedRenderers).toContain(slotRendererEntry);
    expect(shadcnExtendedRenderers).toEqual([
      ...extendedControlRenderers,
      ...extendedLayoutRenderers,
    ]);
  });
});
