import { controlRegistry } from '@chobantonov/jsonforms-svelte-renderer-common';
import * as entries from './entries';

export * from './components';
export { default as AnyOfStringOrEnumControlRenderer } from './AnyOfStringOrEnumControlRenderer.svelte';
export { default as BooleanControlRenderer } from './BooleanControlRenderer.svelte';
export { default as BooleanToggleControlRenderer } from './BooleanToggleControlRenderer.svelte';
export { default as ControlWrapper } from './ControlWrapper.svelte';
export { default as DateControlRenderer } from './DateControlRenderer.svelte';
export { default as DateTimeControlRenderer } from './DateTimeControlRenderer.svelte';
export { default as EnumControlRenderer } from './EnumControlRenderer.svelte';
export { default as IntegerControlRenderer } from './IntegerControlRenderer.svelte';
export { default as MultiStringControlRenderer } from './MultiStringControlRenderer.svelte';
export { default as NumberControlRenderer } from './NumberControlRenderer.svelte';
export { default as OneOfEnumControlRenderer } from './OneOfEnumControlRenderer.svelte';
export { default as OneOfRadioGroupControlRenderer } from './OneOfRadioGroupControlRenderer.svelte';
export { default as PasswordControlRenderer } from './PasswordControlRenderer.svelte';
export { default as RadioGroupControlRenderer } from './RadioGroupControlRenderer.svelte';
export { default as SliderControlRenderer } from './SliderControlRenderer.svelte';
export { default as StringControlRenderer } from './StringControlRenderer.svelte';
export { default as StringMaskControlRenderer } from './StringMaskControlRenderer.svelte';
export { default as TimeControlRenderer } from './TimeControlRenderer.svelte';
export * from './entries';

export const controlRenderers = controlRegistry(entries);
