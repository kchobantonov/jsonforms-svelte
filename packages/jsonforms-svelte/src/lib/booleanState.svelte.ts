import { useJsonForms } from './jsonFormsCompositions.svelte';
import { dataPathSegments, hasArrayParent } from './dataPath';
import { useRendererMessages } from './rendererMessages.svelte';

/** Keep absent and invalid values distinct from an explicit false answer. */
export function useBooleanState(data: () => unknown, path?: () => string | readonly string[]) {
  const form = useJsonForms();
  const parts = $derived.by(() => {
    const value = path?.() ?? '';
    return typeof value === 'string' ? dataPathSegments(value) : value;
  });
  const arrayItem = $derived(hasArrayParent(form.core?.data, parts));
  const message = useRendererMessages();
  const value = $derived(data());
  const committed = $derived(typeof value === 'boolean');
  const hint = $derived(
    committed ? undefined : message(value === undefined ? 'boolean.notSet' : 'boolean.invalid'),
  );
  return {
    get arrayItem() {
      return arrayItem;
    },
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
