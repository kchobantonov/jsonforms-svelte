import {
  createRendererBindings,
  useNestedInfo,
  type NestedInfo,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import { useStyles } from '../styles';
import { NestedInfoContextSymbol } from './inject';
import type { AppliedOptions, VendorProps } from './appliedOptions';

export const {
  useControlAppliedOptions,
  useLabel: useSkeletonLabel,
  useControl: useSkeletonControl,
  useTextControl: useSkeletonTextControl,
  useLayout: useSkeletonLayout,
  useTableControl: useSkeletonTableControl,
  useArrayControl: useSkeletonArrayControl,
} = createRendererBindings<AppliedOptions, VendorProps, 'skeleton'>('skeleton', useStyles);

export { useCombinatorTranslations } from '@chobantonov/jsonforms-svelte-renderer-common';
export { useAjv, type NestedInfo } from '@chobantonov/jsonforms-svelte-renderer-common';

export const useNested = (element: false | 'array' | 'object'): NestedInfo =>
  useNestedInfo(NestedInfoContextSymbol, element);

export { determineClearValue } from './inject';
