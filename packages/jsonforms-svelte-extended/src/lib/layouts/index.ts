export { default as NativeTemplateLayoutRenderer } from './NativeTemplateLayoutRenderer.svelte';
import { entry as nativeTemplateLayoutRendererEntry } from './NativeTemplateLayoutRenderer.entry';
export { nativeTemplateLayoutRendererEntry };
export { default as MarkupLabelRenderer } from './MarkupLabelRenderer.svelte';
import { entry as markupLabelRendererEntry } from './MarkupLabelRenderer.entry';
export { markupLabelRendererEntry };
export { default as SlotRenderer } from './SlotRenderer.svelte';
export { default as TemplateLayoutRenderer } from './TemplateLayoutRenderer.svelte';
export { default as TemplateRenderer } from './TemplateRenderer.svelte';

import { entry as slotRendererEntry } from './SlotRenderer.entry';
import { entry as templateLayoutRendererEntry } from './TemplateLayoutRenderer.entry';
import { entry as templateRendererEntry } from './TemplateRenderer.entry';

export const extendedSharedLayoutRenderers = [
  markupLabelRendererEntry,
  nativeTemplateLayoutRendererEntry,
  templateLayoutRendererEntry,
  templateRendererEntry,
  slotRendererEntry,
];

export { slotRendererEntry, templateLayoutRendererEntry, templateRendererEntry };

export { useSplitLayout } from './splitLayout.svelte';
