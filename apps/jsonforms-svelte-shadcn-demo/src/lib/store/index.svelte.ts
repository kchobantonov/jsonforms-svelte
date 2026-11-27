import { createShadcnDemoStore } from '$shadcnDemo/createShadcnDemoStore.svelte';

const appstore = createShadcnDemoStore('shadcn-example');
export const useAppStore = () => appstore;
