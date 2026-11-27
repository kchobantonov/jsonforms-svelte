import type { JsonSchema } from '@jsonforms/core';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { usePendingControlAction } from '../interaction/detailDialog.svelte';

export function useBranchChange(
  target: () => {
    path: string;
    schema: JsonSchema;
    rootSchema: JsonSchema;
    data?: unknown;
    enabled: boolean;
    visible: boolean;
    readonly?: boolean;
  },
) {
  const prepare = usePendingControlAction();
  let preparing = false;
  return async (perform: (rootSchema: JsonSchema) => void) => {
    const control = target();
    if (preparing || !control.enabled || control.readonly) return;
    const { path, schema, rootSchema } = control;
    const initial = cloneDeep(control.data);
    const valid = (data: unknown) => {
      const current = target();
      return (
        current.path === path &&
        isEqual(current.schema, schema) &&
        isEqual(current.rootSchema, rootSchema) &&
        current.visible &&
        current.enabled &&
        !current.readonly &&
        isEqual(current.data, data)
      );
    };
    preparing = true;
    let flushed: unknown;
    try {
      const ready = await prepare(
        () => valid(initial),
        () => {
          flushed = cloneDeep(target().data);
          return () => valid(flushed);
        },
      );
      if (ready && valid(flushed)) perform(rootSchema);
    } finally {
      preparing = false;
    }
  };
}
