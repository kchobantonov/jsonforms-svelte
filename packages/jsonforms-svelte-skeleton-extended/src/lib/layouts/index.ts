export {
  TemplateLayoutRenderer,
  templateLayoutRendererEntry,
} from '@chobantonov/jsonforms-svelte-extended';
export { default as SplitLayoutRenderer } from './SplitLayoutRenderer.svelte';

import { templateLayoutRendererEntry } from '@chobantonov/jsonforms-svelte-extended';
import { entry as splitLayoutRendererEntry } from './SplitLayoutRenderer.entry';

export const extendedLayoutRenderers = [splitLayoutRendererEntry, templateLayoutRendererEntry];

export { splitLayoutRendererEntry };
