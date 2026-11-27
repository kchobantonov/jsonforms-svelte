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
  useLabel: useFlowbiteLabel,
  useControl: useFlowbiteControl,
  useTextControl: useFlowbiteTextControl,
  useLayout: useFlowbiteLayout,
  useTableControl: useFlowbiteTableControl,
  useArrayControl: useFlowbiteArrayControl,
} = createRendererBindings<AppliedOptions, VendorProps, 'flowbite'>('flowbite', useStyles);

export { useCombinatorTranslations } from '@chobantonov/jsonforms-svelte-renderer-common';
export { useAjv, type NestedInfo } from '@chobantonov/jsonforms-svelte-renderer-common';

export const useNested = (element: false | 'array' | 'object'): NestedInfo =>
  useNestedInfo(NestedInfoContextSymbol, element);

export { determineClearValue } from './inject';
