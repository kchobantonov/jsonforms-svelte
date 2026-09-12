export { default as LabelRenderer } from './LabelRenderer.svelte';
export { default as ListWithDetailRenderer } from './ListWithDetailRenderer.svelte';

import { entry as labelRendererEntry } from './LabelRenderer.entry';
import { entry as listWithDetailRendererEntry } from './ListWithDetailRenderer.entry';

export const additionalRenderers = [
  separatorRendererEntry,
  spacerRendererEntry,
  imageViewRendererEntry,
  labelRendererEntry,
  listWithDetailRendererEntry,
];

export { labelRendererEntry, listWithDetailRendererEntry };

export { default as SeparatorRenderer } from './SeparatorRenderer.svelte';
import { entry as separatorRendererEntry } from './SeparatorRenderer.entry';
export { separatorRendererEntry };

export { default as SpacerRenderer } from './SpacerRenderer.svelte';
import { entry as spacerRendererEntry } from './SpacerRenderer.entry';
export { spacerRendererEntry };

export { default as ImageViewRenderer } from './ImageViewRenderer.svelte';
import { entry as imageViewRendererEntry } from './ImageViewRenderer.entry';
export { imageViewRendererEntry };
