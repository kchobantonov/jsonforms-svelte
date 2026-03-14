export { default as ButtonRenderer } from './ButtonRenderer.svelte';
export { default as DurationControlRenderer } from './DurationControlRenderer.svelte';
export { default as FileControlRenderer } from './FileControlRenderer.svelte';
export { default as NullControlRenderer } from './NullControlRenderer.svelte';

import { entry as buttonRendererEntry } from './ButtonRenderer.entry';
import { entry as durationControlRendererEntry } from './DurationControlRenderer.entry';
import { entry as fileControlRendererEntry } from './FileControlRenderer.entry';
import { entry as nullControlRendererEntry } from './NullControlRenderer.entry';

export const extendedControlRenderers = [
  buttonRendererEntry,
  durationControlRendererEntry,
  fileControlRendererEntry,
  nullControlRendererEntry,
];

export {
  buttonRendererEntry,
  durationControlRendererEntry,
  fileControlRendererEntry,
  nullControlRendererEntry,
};
