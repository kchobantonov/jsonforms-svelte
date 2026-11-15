export { default as LinkRenderer } from './LinkRenderer.svelte';
import { entry as linkRendererEntry } from './LinkRenderer.entry';
export { linkRendererEntry };
export {
  SlotRenderer,
  slotRendererEntry,
  TemplateLayoutRenderer,
  templateLayoutRendererEntry,
  nativeTemplateLayoutRendererEntry,
  NativeTemplateLayoutRenderer,
  TemplateRenderer,
  templateRendererEntry,
} from '@chobantonov/jsonforms-svelte-extended';
export { default as MarkupLabelRenderer } from './MarkupLabelRenderer.svelte';
import { entry as markupLabelRendererEntry } from './MarkupLabelRenderer.entry';
export { markupLabelRendererEntry };
export { default as SplitLayoutRenderer } from './SplitLayoutRenderer.svelte';

import {
  extendedSharedLayoutRenderers as sharedLayoutRenderers,
  markupLabelRendererEntry as sharedMarkupLabelRendererEntry,
} from '@chobantonov/jsonforms-svelte-extended';
import { entry as splitLayoutRendererEntry } from './SplitLayoutRenderer.entry';

export const extendedSharedLayoutRenderers = sharedLayoutRenderers.map((entry) =>
  entry === sharedMarkupLabelRendererEntry ? markupLabelRendererEntry : entry,
);

export const extendedLayoutRenderers = [
  linkRendererEntry,
  splitLayoutRendererEntry,
  ...extendedSharedLayoutRenderers,
];

export { splitLayoutRendererEntry };
