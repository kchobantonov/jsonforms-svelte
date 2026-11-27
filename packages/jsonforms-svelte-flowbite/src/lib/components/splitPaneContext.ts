import type { useSplitPane } from '@chobantonov/jsonforms-svelte-renderer-common';
export type SplitPaneContext = ReturnType<typeof useSplitPane>;
export const splitPaneContext = Symbol('Flowbite split pane');
