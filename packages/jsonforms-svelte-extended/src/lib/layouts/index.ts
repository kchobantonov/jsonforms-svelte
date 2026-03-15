export { default as TemplateLayoutRenderer } from "./TemplateLayoutRenderer.svelte";

import { entry as templateLayoutRendererEntry } from "./TemplateLayoutRenderer.entry";

export const extendedSharedLayoutRenderers = [templateLayoutRendererEntry];

export { templateLayoutRendererEntry };
