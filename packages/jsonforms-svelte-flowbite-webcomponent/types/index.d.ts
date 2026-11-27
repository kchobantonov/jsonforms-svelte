import type { JsonFormsEventTarget, JsonFormsHostProperties } from '../../../webcomponent-host.js';
export type {
  JsonFormsValidationError,
  JsonFormsValidityEvent,
} from '../../../webcomponent-host.js';

/** Import this package in a browser to register its custom element. Exports its in-process trusted-function capability. */
export interface JsonFormsFlowbiteElement extends JsonFormsEventTarget, JsonFormsHostProperties {}

declare global {
  interface HTMLElementTagNameMap {
    'jsonforms-svelte-flowbite': JsonFormsFlowbiteElement;
  }
}

/** Capability for callbacks in this bundled custom element; never serialized. */
export declare const TRUST_DYNAMIC_FUNCTIONS: unique symbol;
