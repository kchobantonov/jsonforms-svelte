export { default as SplitLayoutRenderer } from './SplitLayoutRenderer.svelte';

import { entry as splitLayoutRendererEntry } from './SplitLayoutRenderer.entry';

export const extendedLayoutRenderers = [splitLayoutRendererEntry];

export { splitLayoutRendererEntry };
