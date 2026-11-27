import { createShadcnDemoStore } from '$shadcnDemo/createShadcnDemoStore.svelte';

// Shared demo files resolve $lib/store through the consuming application's alias.
const appstore = createShadcnDemoStore('shadcn-sketch-example');
export const useAppStore = () => appstore;
