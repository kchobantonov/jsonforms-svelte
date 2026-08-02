import type { ControlProps, RendererProps } from '@chobantonov/jsonforms-svelte';
import type { ControlElement } from '@jsonforms/core';

export type AgGridRendererProps = RendererProps<ControlElement>;

export type AgGridCellHostProps = Required<
  Pick<ControlProps, 'schema' | 'uischema' | 'path' | 'enabled' | 'renderers' | 'cells' | 'config'>
>;

export interface AgGridWrappedRow {
  key: string;
  sourceIndex: number;
  value: unknown;
}
