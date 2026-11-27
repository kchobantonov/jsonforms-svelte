import { cellRegistry } from '@chobantonov/jsonforms-svelte-renderer-common';
import * as entries from './entries';

export { default as BooleanCell } from './BooleanCell.svelte';
export { default as CompositeCell } from './CompositeCell.svelte';
export { default as DateCell } from './DateCell.svelte';
export { default as DateTimeCell } from './DateTimeCell.svelte';
export { default as DispatchRendererCell } from './DispatchRendererCell.svelte';
export { default as EnumCell } from './EnumCell.svelte';
export { default as IntegerCell } from './IntegerCell.svelte';
export { default as NumberCell } from './NumberCell.svelte';
export { default as NumberFormatCell } from './NumberFormatCell.svelte';
export { default as OneOfEnumCell } from './OneOfEnumCell.svelte';
export { default as TextCell } from './TextCell.svelte';
export * from './entries';

export const skeletonCells = cellRegistry(entries);
