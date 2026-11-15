import type { ControlProps, RendererProps } from '@chobantonov/jsonforms-svelte';
import type { ControlElement } from '@jsonforms/core';
import type { ErrorObject } from 'ajv';

export type AgGridRendererProps = RendererProps<ControlElement>;

export type AgGridCellHostProps = Required<
  Pick<ControlProps, 'schema' | 'uischema' | 'path' | 'enabled' | 'renderers' | 'cells' | 'config'>
> & {
  item?: { key: string; path: string; sourceItem: unknown };
  rowDetail?: {
    options: import('@chobantonov/jsonforms-svelte').RowDetailOptions;
    scope: string;
    index: number;
    errors: ErrorObject[];
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
