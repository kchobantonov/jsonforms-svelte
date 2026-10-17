import { useRendererMessages } from './rendererMessages.svelte';

/** Keep absent and invalid values distinct from an explicit false answer. */
export function useBooleanState(data: () => unknown) {
  const message = useRendererMessages();
  const value = $derived(data());
  const committed = $derived(typeof value === 'boolean');
  const hint = $derived(
    committed ? undefined : message(value === undefined ? 'boolean.notSet' : 'boolean.invalid'),
  );
  return {
    describeWith(existing: unknown, stateId: string) {
      return (
        [
          typeof existing === 'string' ? existing : undefined,
          hint === undefined ? undefined : stateId,
        ]
          .filter(Boolean)
          .join(' ') || undefined
      );
    },
    get checked() {
      return value === true;
    },
    get indeterminate() {
      return !committed;
    },
    get hint() {
      return hint;
    },
  };
}
