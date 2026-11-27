import type { Component } from 'svelte';
import {
  dynamicPropertyContext,
  portalTargetContext,
  type RendererControlWrapperProps,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import type { useControlAppliedOptions } from './composition.svelte';

export const IsDynamicPropertyContext = Symbol.for(
  'jsonforms-svelte-shadcn:IsDynamicPropertyContext',
);

export type AppliedOptions = ReturnType<typeof useControlAppliedOptions>['value'];
export interface ControlWrapperProps extends RendererControlWrapperProps {
  appliedOptions: AppliedOptions;
}

export type ControlWrapperType = Component<ControlWrapperProps>;

export const ControlWrapperSymbol = Symbol.for('jsonforms-svelte-shadcn:ControlWrapper');
export const NestedInfoContextSymbol = Symbol.for('jsonforms-svelte-shadcn:NestedInfo');
export const StylesContextSymbol = Symbol.for('jsonforms-svelte-shadcn:Styles');
export const NavigationContextSymbol = Symbol.for('jsonforms-svelte-shadcn:NavigationContext');
export const PortalTargetContextSymbol = Symbol.for('jsonforms-svelte-shadcn:PortalTarget');

export const { setIsDynamicProperty, getIsDynamicProperty, determineClearValue } =
  dynamicPropertyContext(IsDynamicPropertyContext);

export type { PortalTargetResolver } from '@chobantonov/jsonforms-svelte-renderer-common';

export const { setPortalTargetResolver, getPortalTargetResolver, getPortalTarget } =
  portalTargetContext(PortalTargetContextSymbol);
