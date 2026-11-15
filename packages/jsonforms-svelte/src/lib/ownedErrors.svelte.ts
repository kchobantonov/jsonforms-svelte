import { getContext } from 'svelte';
import { OwnedErrorsContextSymbol, type OwnedErrorStore } from './ownedErrors';

/** Optional for renderers that may also be mounted outside this form integration. */
export const useOwnedErrors = (): OwnedErrorStore | undefined =>
  getContext(OwnedErrorsContextSymbol);
