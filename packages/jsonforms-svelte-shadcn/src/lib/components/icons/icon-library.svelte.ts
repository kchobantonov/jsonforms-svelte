import { writable } from 'svelte/store';
import type { ShadcnDesignSystemConfig } from '../../theme/design-system';

export type IconLibrary = ShadcnDesignSystemConfig['iconLibrary'];

const supported = new Set<IconLibrary>(['lucide', 'tabler', 'hugeicons', 'phosphor', 'remixicon']);

export const currentIconLibrary = writable<IconLibrary>('lucide');

export const setIconLibrary = (value: string | undefined) => {
  const library = value as IconLibrary | undefined;
  currentIconLibrary.set(library && supported.has(library) ? library : 'lucide');
};
