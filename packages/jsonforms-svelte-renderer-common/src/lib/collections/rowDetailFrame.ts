import type { Snippet } from 'svelte';
import type { JsonSchema } from '@jsonforms/core';
import type { RowDetailPanelState } from './rowDetail.svelte';
export interface RowDetailFrameProps {
  panel: RowDetailPanelState;
  schema: JsonSchema;
  path: string;
  scope: string;
  enabled: boolean;
  height?: number | string;
  children: Snippet;
}
