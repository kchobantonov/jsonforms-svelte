import type { UISchemaElement } from '@jsonforms/core';
import { getContext, setContext } from 'svelte';
import { useUIDiagnosticReporter } from './authorDiagnostic.svelte';

const context = Symbol('object detail dispatch');
type Dispatch = { uischema: UISchemaElement; path: string };
type Ancestor = { current: () => Dispatch; parent?: Ancestor };

export const UI_SCHEMA_CYCLE_DIAGNOSTIC = 'uischema.registryCycle';

const signatureOf = ({ uischema, path }: Dispatch): string =>
  JSON.stringify([
    path,
    uischema.type,
    'scope' in uischema ? uischema.scope : undefined,
    'name' in uischema ? uischema.name : undefined,
  ]);

/** Guard the resolved element before presentation clones it. The same registry
 * entry is valid in sibling forms and at different nested data paths. */
export function useUiSchemaCycleGuard(current: () => Dispatch) {
  const reportDiagnostic = useUIDiagnosticReporter();
  const parent = getContext<Ancestor | undefined>(context);
  setContext<Ancestor>(context, { current, parent });
  let warnedSignature: string | undefined;
  const cycle = (): boolean => {
    const signature = signatureOf(current());
    for (let ancestor = parent; ancestor; ancestor = ancestor.parent) {
      if (signatureOf(ancestor.current()) === signature) return true;
    }
    return false;
  };

  $effect(() => {
    if (!cycle()) {
      warnedSignature = undefined;
      return;
    }
    const signature = signatureOf(current());
    const pending = setTimeout(() => {
      if (!cycle() || signatureOf(current()) !== signature || warnedSignature === signature) return;
      const value = current();
      warnedSignature = signature;
      reportDiagnostic(UI_SCHEMA_CYCLE_DIAGNOSTIC, {
        severity: 'warning',
        path: value.path,
        type: value.uischema.type,
        scope: 'scope' in value.uischema ? value.uischema.scope : undefined,
        message:
          'The UI schema registry dispatched an element back to itself; generated fields were used.',
      });
    }, 0);
    return () => clearTimeout(pending);
  });

  return {
    get cycle() {
      return cycle();
    },
  };
}
