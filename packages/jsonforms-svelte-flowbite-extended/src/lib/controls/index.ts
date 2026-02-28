export { default as DurationControlRenderer } from './DurationControlRenderer.svelte';
export { default as FileControlRenderer } from './FileControlRenderer.svelte';

import { entry as durationControlRendererEntry } from './DurationControlRenderer.entry';
import { entry as fileControlRendererEntry } from './FileControlRenderer.entry';

export const extendedControlRenderers = [durationControlRendererEntry, fileControlRendererEntry];

export { durationControlRendererEntry };
export { fileControlRendererEntry };
