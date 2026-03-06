import { getContext, setContext } from 'svelte';

import type { Component, Snippet } from 'svelte';
import type { Styles } from '../styles';
import type { useControlAppliedOptions } from './composition.svelte';

export const IsDynamicPropertyContext = Symbol.for(
  'jsonforms-svelte-skeleton:IsDynamicPropertyContext',
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

export const ControlWrapperSymbol = Symbol.for('jsonforms-svelte-skeleton:ControlWrapper');
export const NestedInfoContextSymbol = Symbol.for('jsonforms-svelte-skeleton:NestedInfo');
export const StylesContextSymbol = Symbol.for('jsonforms-svelte-skeleton:Styles');
export const NavigationContextSymbol = Symbol.for('jsonforms-svelte-skeleton:NavigationContext');
export const PortalTargetContextSymbol = Symbol.for('jsonforms-svelte-skeleton:PortalTarget');

export type PortalTargetResolver = () => HTMLElement | undefined | null;

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

/**
 * Provide a portal target resolver for popups/dropdowns.
 * Usage: setPortalTargetResolver(() => containerElement)
 */
export function setPortalTargetResolver(resolver: PortalTargetResolver): void {
  setContext(PortalTargetContextSymbol, resolver);
}

export function getPortalTargetResolver(): PortalTargetResolver {
  return getContext<PortalTargetResolver>(PortalTargetContextSymbol) ?? (() => undefined);
}

/**
 * Resolve the current portal target from context.
 * Usage: const target = getPortalTarget();
 */
export function getPortalTarget(): HTMLElement | undefined {
  const resolver = getPortalTargetResolver();
  return resolver?.() ?? undefined;
}

/**
 * Capture a root-node getter during component init, safe to pass to Zag as callback.
 */
export function getPortalRootNodeGetter(): () => ShadowRoot | Document | Node {
  const resolver = getPortalTargetResolver();
  return () => {
    const target = resolver();
    if (target?.getRootNode) {
      return target.getRootNode();
    }
    if (typeof document !== 'undefined') {
      return document;
    }
    return {} as Document;
  };
}
