import { untrack } from 'svelte';
import { reconcileRowDetailSelection } from './rowDetailIdentity';

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
  keys?: () => readonly string[];
  prepare: () => boolean;
}) {
  const options = $derived(resolveRowDetailOptions(input.options()));
  let panelOpen = $state(untrack(() => options?.collapsed !== true));
  let selectedKey = $state<string | undefined>();
  let selection = $state.raw<{ index: number; source: unknown }>();
  let previous = untrack(input.rows);
  $effect(() => {
    const rows = input.rows();
    if (input.keys) {
      if (selectedKey !== undefined && !input.keys().includes(selectedKey)) selectedKey = undefined;
    } else selection = reconcileRowDetailSelection(selection, previous, rows);
    previous = rows;
  });
  return {
    get options() {
      return options;
    },
    get selectedIndex() {
      if (!input.keys) return selection?.index;
      const index = selectedKey === undefined ? -1 : input.keys().indexOf(selectedKey);
      return index < 0 ? undefined : index;
    },
    get selectedKey() {
      return selectedKey;
    },
    get selectedItem() {
      const index = this.selectedIndex;
      return index === undefined ? undefined : input.rows()?.[index];
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
      if (input.keys) selectedKey = input.keys()[index];
      else selection = { index, source: rows[index] };
      if (reveal) panelOpen = true;
    },
    toggle() {
      if (input.prepare()) panelOpen = !panelOpen;
    },
  };
}

export type RowDetailPanelState = ReturnType<typeof useRowDetailPanel>;
