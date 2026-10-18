import get from 'lodash/get';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { dataPathSegments } from './dataPath';
import { useRendererMessages } from './rendererMessages.svelte';

/** Keep absent and invalid values distinct from an explicit false answer. */
export function useBooleanState(data: () => unknown, path?: () => string) {
  const form = useJsonForms();
  const parts = $derived(dataPathSegments(path?.() ?? ''));
  const arrayItem = $derived(
    parts.length > 0 &&
      Array.isArray(
        parts.length === 1 ? form.core?.data : get(form.core?.data, parts.slice(0, -1)),
      ),
  );
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
