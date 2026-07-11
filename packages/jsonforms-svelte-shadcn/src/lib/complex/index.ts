export { default as AllOfRenderer } from './AllOfRenderer.svelte';
export { default as AnyOfRenderer } from './AnyOfRenderer.svelte';
export { default as ArrayControlRenderer } from './ArrayControlRenderer.svelte';
export { default as EnumArrayRenderer } from './EnumArrayRenderer.svelte';
export { default as ObjectRenderer } from './ObjectRenderer.svelte';
export { default as OneOfRenderer } from './OneOfRenderer.svelte';
// export { default as OneOfTabRenderer } from './OneOfTabRenderer.svelte';
export { default as MixedRenderer } from './MixedRenderer.svelte';

import { entry as allOfRendererEntry } from './AllOfRenderer.entry';
import { entry as anyOfRendererEntry } from './AnyOfRenderer.entry';
import { entry as arrayControlRendererEntry } from './ArrayControlRenderer.entry';
import { entry as enumArrayRendererEntry } from './EnumArrayRenderer.entry';
import { entry as objectRendererEntry } from './ObjectRenderer.entry';
import { entry as oneOfRendererEntry } from './OneOfRenderer.entry';
// import { entry as oneOfTabRendererEntry } from './OneOfTabRenderer.entry';
import { entry as mixedRendererEntry } from './MixedRenderer.entry';

export const complexRenderers = [
  allOfRendererEntry,
  anyOfRendererEntry,
  arrayControlRendererEntry,
  enumArrayRendererEntry,
  objectRendererEntry,
  oneOfRendererEntry,
  // oneOfTabRendererEntry,
  mixedRendererEntry,
];

export {
  allOfRendererEntry,
  anyOfRendererEntry,
  arrayControlRendererEntry,
  enumArrayRendererEntry,
  objectRendererEntry,
  oneOfRendererEntry,
  // oneOfTabRendererEntry,
  mixedRendererEntry,
};
