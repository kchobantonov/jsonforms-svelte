export { default as LabelRenderer } from './LabelRenderer.svelte';
export { default as ListWithDetailRenderer } from './ListWithDetailRenderer.svelte';

import { entry as labelRendererEntry } from './LabelRenderer.entry';
import { entry as listWithDetailRendererEntry } from './ListWithDetailRenderer.entry';

export const additionalRenderers = [labelRendererEntry, listWithDetailRendererEntry];

export { labelRendererEntry, listWithDetailRendererEntry };
