import type { ControlProps, RendererProps } from '@chobantonov/jsonforms-svelte';
import type { ControlElement } from '@jsonforms/core';

export type AgGridRendererProps = RendererProps<ControlElement>;

export type AgGridCellHostProps = Required<
  Pick<ControlProps, 'schema' | 'uischema' | 'path' | 'enabled' | 'renderers' | 'cells' | 'config'>
> & {
  rowDetail?: {
    options: import('@chobantonov/jsonforms-svelte').RowDetailOptions;
    scope: string;
    index: number;
    selected: boolean;
    prepare: () => boolean;
    select: () => void;
  };
};

export interface AgGridWrappedRow {
  key: string;
  sourceIndex: number;
  value: unknown;
}
