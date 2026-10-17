import { untrack } from 'svelte';

export interface RowDetailOptions extends Record<string, unknown> {
  presentation: 'dialog' | 'panel';
  placement?: 'right' | 'bottom';
  collapsed?: boolean;
  resizable?: boolean;
  detail?: unknown;
}

export function resolveRowDetailOptions(value: unknown): RowDetailOptions | undefined {
  if (!value || typeof value !== 'object' || !('presentation' in value)) return undefined;
  return value.presentation === 'dialog' || value.presentation === 'panel'
    ? (value as RowDetailOptions)
    : undefined;
}

/** Selection follows original row identity; draft flushing precedes pane transitions. */
export function useRowDetailPanel(input: {
  options: () => unknown;
  rows: () => unknown[] | undefined;
  prepare: () => boolean;
}) {
  const options = $derived(resolveRowDetailOptions(input.options()));
  let panelOpen = $state(untrack(() => options?.collapsed !== true));
  let selection = $state.raw<{ index: number; source: unknown }>();
  let previous = untrack(input.rows);
  $effect(() => {
    const rows = input.rows();
    if (
      selection &&
      (!rows || selection.index >= rows.length || rows[selection.index] !== selection.source)
    ) {
      const moved = rows?.indexOf(selection.source) ?? -1;
      if (moved >= 0) selection = { index: moved, source: selection.source };
      else if (
        rows &&
        previous &&
        rows.length === previous.length &&
        rows.every((value, index) => index === selection!.index || value === previous?.[index])
      ) {
        selection = { index: selection.index, source: rows[selection.index] };
      } else selection = undefined;
    }
    previous = rows;
  });
  return {
    get options() {
      return options;
    },
    get selectedIndex() {
      return selection?.index;
    },
    get panelOpen() {
      return panelOpen;
    },
    get visible() {
      return options?.presentation === 'panel' && panelOpen;
    },
    select(index: number, reveal = false) {
      if (!input.prepare()) return;
      const rows = input.rows();
      if (!rows || index < 0 || index >= rows.length) return;
      selection = { index, source: rows[index] };
      if (reveal) panelOpen = true;
    },
    toggle() {
      if (input.prepare()) panelOpen = !panelOpen;
    },
  };
}

export type RowDetailPanelState = ReturnType<typeof useRowDetailPanel>;
