import type { Component } from 'svelte';
import {
  dynamicPropertyContext,
  type RendererControlWrapperProps,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import type { useControlAppliedOptions } from './composition.svelte';

export const IsDynamicPropertyContext = Symbol.for(
  'jsonforms-svelte-flowbite:IsDynamicPropertyContext',
);

type AppliedOptions = ReturnType<typeof useControlAppliedOptions>['value'];
export interface ControlWrapperProps extends RendererControlWrapperProps {
  appliedOptions: AppliedOptions;
}

export type ControlWrapperType = Component<ControlWrapperProps>;

export const ControlWrapperSymbol = Symbol.for('jsonforms-svelte-flowbite:ControlWrapper');
export const NestedInfoContextSymbol = Symbol.for('jsonforms-svelte-flowbite:NestedInfo');
export const StylesContextSymbol = Symbol.for('jsonforms-svelte-flowbite:Styles');
export const NavigationContextSymbol = Symbol.for('jsonforms-svelte-flowbite:NavigationContext');

export const { setIsDynamicProperty, getIsDynamicProperty, determineClearValue } =
  dynamicPropertyContext(IsDynamicPropertyContext);
