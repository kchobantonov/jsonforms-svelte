import { getContext } from 'svelte';

export interface CollectionItemIdentity {
  readonly key: string;
  readonly path: string;
  readonly hasSourceItem?: boolean;
  readonly sourceItem?: unknown;
}
export const CollectionItemContextSymbol = Symbol.for('jsonforms-svelte.collection-item');
export const useCollectionItemIdentity = (): CollectionItemIdentity | undefined =>
  getContext(CollectionItemContextSymbol);
