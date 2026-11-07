import type { useSplitPane } from '@chobantonov/jsonforms-svelte';
export type SplitPaneContext = ReturnType<typeof useSplitPane>;
export const splitPaneContext = Symbol('Flowbite split pane');
