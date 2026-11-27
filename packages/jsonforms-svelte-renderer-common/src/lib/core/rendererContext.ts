import { getContext, setContext } from 'svelte';

export function dynamicPropertyContext(key: symbol) {
  return {
    determineClearValue<T>(defaultValue: T): T | undefined {
      // Clearing a dynamic property keeps its key and resets its value.
      return getContext<boolean>(key) ? defaultValue : undefined;
    },
    setIsDynamicProperty(value: boolean) {
      setContext(key, value);
    },
    getIsDynamicProperty(defaultValue = false): boolean {
      const value = getContext<boolean>(key);
      return value === undefined ? defaultValue : value;
    },
  };
}

export type PortalTargetResolver = () => HTMLElement | undefined | null;

export function portalTargetContext(key: symbol) {
  function getPortalTargetResolver(): PortalTargetResolver {
    return getContext<PortalTargetResolver>(key) ?? (() => undefined);
  }
  return {
    setPortalTargetResolver(resolver: PortalTargetResolver) {
      setContext(key, resolver);
    },
    getPortalTargetResolver,
    getPortalTarget(): HTMLElement | undefined {
      return getPortalTargetResolver()() ?? undefined;
    },
  };
}
