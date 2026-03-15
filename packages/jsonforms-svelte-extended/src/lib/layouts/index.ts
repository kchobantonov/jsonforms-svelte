export { default as SlotRenderer } from "./SlotRenderer.svelte";
export { default as TemplateLayoutRenderer } from "./TemplateLayoutRenderer.svelte";
export { default as TemplateRenderer } from "./TemplateRenderer.svelte";

import { entry as slotRendererEntry } from "./SlotRenderer.entry";
import { entry as templateLayoutRendererEntry } from "./TemplateLayoutRenderer.entry";
import { entry as templateRendererEntry } from "./TemplateRenderer.entry";

export const extendedSharedLayoutRenderers = [
  templateLayoutRendererEntry,
  templateRendererEntry,
  slotRendererEntry,
];

export {
  slotRendererEntry,
  templateLayoutRendererEntry,
  templateRendererEntry,
};
