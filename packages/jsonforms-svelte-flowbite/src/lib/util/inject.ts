import { getContext, setContext } from 'svelte';

import type { Component, Snippet } from 'svelte';
import type { Styles } from '../styles';
import type { useControlAppliedOptions } from './composition.svelte';

export const IsDynamicPropertyContext = Symbol.for(
  'jsonforms-svelte-flowbite:IsDynamicPropertyContext',
);

export type AppliedOptions = ReturnType<typeof useControlAppliedOptions>['value'];
export interface ControlWrapperProps {
  id: string;
  description: string;
  errors: string;
  label: string;
  visible: boolean;
  required: boolean;
  persistentHint: boolean;
  isFocused: boolean;
  styles: Styles;
  appliedOptions: AppliedOptions;
  children: Snippet;
  layout?: 'vertical' | 'horizontal';
}

export type ControlWrapperType = Component<ControlWrapperProps>;

export const ControlWrapperSymbol = Symbol.for('jsonforms-svelte-flowbite:ControlWrapper');
export const NestedInfoContextSymbol = Symbol.for('jsonforms-svelte-flowbite:NestedInfo');
export const StylesContextSymbol = Symbol.for('jsonforms-svelte-flowbite:Styles');
export const NavigationContextSymbol = Symbol.for('jsonforms-svelte-flowbite:NavigationContext');

/**
 * Provide the dynamic property context
 * Usage: setIsDynamicProperty(true)
 */
export function setIsDynamicProperty(isDynamic: boolean): void {
  setContext(IsDynamicPropertyContext, isDynamic);
}

/**
 * Inject the dynamic property context with default fallback
 * Usage: const isDynamic = getIsDynamicProperty(false)
 */
export function getIsDynamicProperty(defaultValue = false): boolean {
  const value = getContext<boolean>(IsDynamicPropertyContext);
  return value !== undefined ? value : defaultValue;
}
