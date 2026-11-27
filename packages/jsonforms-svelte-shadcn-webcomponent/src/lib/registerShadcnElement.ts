import type { Attachment } from 'svelte/attachments';
import ShadcnComponent from './JsonFormsWebComponent.svelte';

export interface ShadcnElementSkin {
  styles: string;
  attach?: Attachment<HTMLDivElement>;
}

export function registerShadcnElement(tag: string, skin: ShadcnElementSkin) {
  const Element = ShadcnComponent.element!;
  customElements.define(
    tag,
    class extends Element {
      get skin() {
        return skin;
      }
    },
  );
}
