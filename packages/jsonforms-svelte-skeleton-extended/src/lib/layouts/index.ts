export { default as LinkRenderer } from './LinkRenderer.svelte';
import { entry as linkRendererEntry } from './LinkRenderer.entry';
export { linkRendererEntry };
export {
  extendedSharedLayoutRenderers,
  MarkupLabelRenderer,
  markupLabelRendererEntry,
  SlotRenderer,
  slotRendererEntry,
  TemplateLayoutRenderer,
  templateLayoutRendererEntry,
  nativeTemplateLayoutRendererEntry,
  NativeTemplateLayoutRenderer,
  TemplateRenderer,
  templateRendererEntry,
} from '@chobantonov/jsonforms-svelte-extended';
export { default as SplitLayoutRenderer } from './SplitLayoutRenderer.svelte';

import { extendedSharedLayoutRenderers } from '@chobantonov/jsonforms-svelte-extended';
import { entry as splitLayoutRendererEntry } from './SplitLayoutRenderer.entry';

export const extendedLayoutRenderers = [
  linkRendererEntry,
  splitLayoutRendererEntry,
  ...extendedSharedLayoutRenderers,
];

export { splitLayoutRendererEntry };
