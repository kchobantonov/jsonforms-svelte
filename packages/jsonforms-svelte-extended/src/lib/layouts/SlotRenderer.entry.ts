import {
  rankWith,
  uiTypeIs,
  type JsonFormsRendererRegistryEntry,
} from "@jsonforms/core";
import slotRenderer from "./SlotRenderer.svelte";

export const entry: JsonFormsRendererRegistryEntry = {
  renderer: slotRenderer,
  tester: rankWith(2, uiTypeIs("Slot")),
};
