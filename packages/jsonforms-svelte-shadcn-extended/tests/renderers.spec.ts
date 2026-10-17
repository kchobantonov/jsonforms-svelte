import { describe, expect, it } from 'vitest';
import {
  buttonRendererEntry,
  colorControlRendererEntry,
  cronControlRendererEntry,
  durationControlRendererEntry,
  extendedControlRenderers,
  fileControlRendererEntry,
  nullControlRendererEntry,
  monacoControlRendererEntry,
  shadcnAgGridArrayRendererEntry,
} from '../src/lib/controls';
import {
  extendedLayoutRenderers,
  linkRendererEntry,
  markupLabelRendererEntry,
  slotRendererEntry,
  splitLayoutRendererEntry,
  templateLayoutRendererEntry,
  nativeTemplateLayoutRendererEntry,
  templateRendererEntry,
} from '../src/lib/layouts';
import { shadcnExtendedRenderers } from '../src/lib/renderers';

describe('renderers exports', () => {
  it('re-exports control and layout entries via shadcnExtendedRenderers', () => {
    expect(shadcnExtendedRenderers).toHaveLength(15);
    expect(shadcnExtendedRenderers).toContain(linkRendererEntry);
    expect(shadcnExtendedRenderers).toContain(markupLabelRendererEntry);
    expect(shadcnExtendedRenderers).toContain(buttonRendererEntry);
    expect(shadcnExtendedRenderers).toContain(colorControlRendererEntry);
    expect(shadcnExtendedRenderers).toContain(cronControlRendererEntry);
    expect(shadcnExtendedRenderers).toContain(durationControlRendererEntry);
    expect(shadcnExtendedRenderers).toContain(fileControlRendererEntry);
    expect(shadcnExtendedRenderers).toContain(monacoControlRendererEntry);
    expect(shadcnExtendedRenderers).toContain(nullControlRendererEntry);
    expect(shadcnExtendedRenderers).toContain(shadcnAgGridArrayRendererEntry);
    expect(shadcnExtendedRenderers).toContain(splitLayoutRendererEntry);
    expect(shadcnExtendedRenderers).toContain(templateLayoutRendererEntry);
    expect(shadcnExtendedRenderers).toContain(nativeTemplateLayoutRendererEntry);
    expect(shadcnExtendedRenderers).toContain(templateRendererEntry);
    expect(shadcnExtendedRenderers).toContain(slotRendererEntry);
    expect(shadcnExtendedRenderers).toEqual([
      ...extendedControlRenderers,
      ...extendedLayoutRenderers,
    ]);
  });
});
