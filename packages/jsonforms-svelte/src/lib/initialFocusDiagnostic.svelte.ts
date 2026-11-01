import { getContext } from 'svelte';

/** Author feedback only: native controls still decide which autofocus request wins. */
export class InitialFocusDiagnostic {
  private requests = new Map<symbol, string>();
  private warned = new Set<string>();
  private scheduled = false;

  update(identity: symbol, path: string | undefined) {
    if (path === undefined) this.requests.delete(identity);
    else this.requests.set(identity, path);
    if (this.requests.size < 2 || this.scheduled) return;
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      if (this.requests.size < 2) return;
      const paths = [...this.requests.values()].sort();
      const signature = JSON.stringify(paths);
      if (this.warned.has(signature)) return;
      this.warned.add(signature);
      console.warn('focus.conflict', { paths });
    });
  }
}

export const InitialFocusDiagnosticSymbol = Symbol('jsonforms-initial-focus-diagnostic');
export const InitialFocusViewSymbol = Symbol('jsonforms-initial-focus-view');

/** Register only a mounted, visible and focusable initial request. */
export function useInitialFocusRequest(active: () => boolean, path: () => string) {
  const diagnostic = getContext<InitialFocusDiagnostic | undefined>(InitialFocusDiagnosticSymbol);
  const view = getContext<(() => boolean) | undefined>(InitialFocusViewSymbol);
  if (!diagnostic) return;
  const identity = Symbol();
  $effect(() => {
    diagnostic.update(identity, active() && (view?.() ?? true) ? path() : undefined);
    return () => diagnostic.update(identity, undefined);
  });
}
