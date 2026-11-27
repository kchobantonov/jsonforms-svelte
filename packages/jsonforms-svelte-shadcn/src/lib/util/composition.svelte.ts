import {
  createRendererBindings,
  useNestedInfo,
  type NestedInfo,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import { useStyles } from '../styles';
import { NestedInfoContextSymbol } from './inject';

export const {
  useControlAppliedOptions,
  useLabel: useShadcnLabel,
  useControl: useShadcnControl,
  useTextControl: useShadcnTextControl,
  useLayout: useShadcnLayout,
  useTableControl: useShadcnTableControl,
  useArrayControl: useShadcnArrayControl,
} = createRendererBindings<Record<string, any>, Record<string, any>, 'shadcn', any>(
  'shadcn',
  useStyles,
);

export { useCombinatorTranslations } from '@chobantonov/jsonforms-svelte-renderer-common';
export { useAjv, type NestedInfo } from '@chobantonov/jsonforms-svelte-renderer-common';

export const useNested = (element: false | 'array' | 'object'): NestedInfo =>
  useNestedInfo(NestedInfoContextSymbol, element);

export { determineClearValue } from './inject';
