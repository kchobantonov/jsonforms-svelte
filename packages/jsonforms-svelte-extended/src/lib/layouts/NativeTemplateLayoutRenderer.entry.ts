import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
import NativeTemplateLayoutRenderer from './NativeTemplateLayoutRenderer.svelte';
export const entry: JsonFormsRendererRegistryEntry = {
  renderer: NativeTemplateLayoutRenderer,
  tester: (uischema) => {
    const template = (uischema as { template?: unknown }).template;
    const descriptor = template as { kind?: unknown; mount?: unknown } | undefined;
    return uischema.type === 'TemplateLayout' &&
      (typeof template === 'function' ||
        (descriptor?.kind === 'svelte-component' && typeof descriptor.mount === 'function'))
      ? 3
      : -1;
  },
};
