import type { Component } from 'svelte';
import {
  dynamicPropertyContext,
  portalTargetContext,
  type RendererControlWrapperProps,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import type { useControlAppliedOptions } from './composition.svelte';

export const IsDynamicPropertyContext = Symbol.for(
  'jsonforms-svelte-skeleton:IsDynamicPropertyContext',
);

type AppliedOptions = ReturnType<typeof useControlAppliedOptions>['value'];
export interface ControlWrapperProps extends RendererControlWrapperProps {
  appliedOptions: AppliedOptions;
}

export type ControlWrapperType = Component<ControlWrapperProps>;

export const ControlWrapperSymbol = Symbol.for('jsonforms-svelte-skeleton:ControlWrapper');
export const NestedInfoContextSymbol = Symbol.for('jsonforms-svelte-skeleton:NestedInfo');
export const StylesContextSymbol = Symbol.for('jsonforms-svelte-skeleton:Styles');
export const NavigationContextSymbol = Symbol.for('jsonforms-svelte-skeleton:NavigationContext');
export const PortalTargetContextSymbol = Symbol.for('jsonforms-svelte-skeleton:PortalTarget');

export const { setIsDynamicProperty, getIsDynamicProperty, determineClearValue } =
  dynamicPropertyContext(IsDynamicPropertyContext);

export type { PortalTargetResolver } from '@chobantonov/jsonforms-svelte-renderer-common';

export const { setPortalTargetResolver, getPortalTargetResolver, getPortalTarget } =
  portalTargetContext(PortalTargetContextSymbol);

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
