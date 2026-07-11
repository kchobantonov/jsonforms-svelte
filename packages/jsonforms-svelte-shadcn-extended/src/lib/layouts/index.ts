export {
  extendedSharedLayoutRenderers,
  SlotRenderer,
  slotRendererEntry,
  TemplateLayoutRenderer,
  templateLayoutRendererEntry,
  TemplateRenderer,
  templateRendererEntry,
} from '@chobantonov/jsonforms-svelte-extended';
export { default as SplitLayoutRenderer } from './SplitLayoutRenderer.svelte';

import { extendedSharedLayoutRenderers } from '@chobantonov/jsonforms-svelte-extended';
import { entry as splitLayoutRendererEntry } from './SplitLayoutRenderer.entry';

export const extendedLayoutRenderers = [splitLayoutRendererEntry, ...extendedSharedLayoutRenderers];

export { splitLayoutRendererEntry };
