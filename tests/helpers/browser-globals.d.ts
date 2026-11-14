import type { JsonFormsValidityEvent } from '../../packages/jsonforms-svelte-flowbite-webcomponent/types/index';
import type {} from '../../packages/jsonforms-svelte-shadcn-webcomponent/types/index';
import type {} from '../../packages/jsonforms-svelte-skeleton-webcomponent/types/index';

declare global {
  interface Window {
    navigationMarker?: boolean;
    formChange?: { data: unknown };
    formValidity?: JsonFormsValidityEvent;
  }
}
