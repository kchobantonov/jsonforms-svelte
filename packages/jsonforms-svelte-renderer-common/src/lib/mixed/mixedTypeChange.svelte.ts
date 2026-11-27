import { createDefaultValue, type JsonSchema } from '@jsonforms/core';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';
import { useJsonForms, type useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
import { usePendingControlAction } from '../interaction/detailDialog.svelte';
import { useConfirmation } from '../interaction/confirmation.svelte';

interface MixedSelection {
  readonly choices: readonly { resolvedSchema: JsonSchema }[];
  readonly index: number | null;
  readonly clearable: boolean;
  select(index: number | null, type: string | null): void;
}

export function useMixedTypeChange(
  binding: Pick<ReturnType<typeof useJsonFormsControl>, 'control' | 'handleChange'>,
  selection: MixedSelection,
) {
  const jsonforms = useJsonForms();
  const confirmation = useConfirmation();
  const prepareAction = usePendingControlAction();
  let preparingTypeChange = false;
  async function requestTypeChange(newIndex: number | null) {
    if (preparingTypeChange || !binding.control.enabled || binding.control.readonly) return;
    const path = binding.control.path;
    const schema = binding.control.schema;
    const rootSchema = binding.control.rootSchema;
    const initialData = cloneDeep(binding.control.data);
    const sameTarget = () =>
      path === binding.control.path &&
      isEqual(schema, binding.control.schema) &&
      isEqual(rootSchema, binding.control.rootSchema) &&
      binding.control.visible &&
      binding.control.enabled &&
      !binding.control.readonly;
    let flushedData: unknown;
    preparingTypeChange = true;
    try {
      if (
        !(await prepareAction(
          () => sameTarget() && isEqual(binding.control.data, initialData),
          () => {
            flushedData = cloneDeep(binding.control.data);
            return () => sameTarget() && isEqual(binding.control.data, flushedData);
          },
        )) ||
        !sameTarget() ||
        !isEqual(binding.control.data, flushedData)
      )
        return;
      if (newIndex !== null && (!Number.isFinite(newIndex) || !selection.choices[newIndex])) return;
      if (newIndex === selection.index || (newIndex === null && !selection.clearable)) return;
      const nextType =
        newIndex === null ? undefined : selection.choices[newIndex].resolvedSchema.type;
      const numericIntent =
        (nextType === 'integer' || nextType === 'number') &&
        typeof binding.control.data === 'number';
      const original = binding.control.data;
      const originalPath = binding.control.path;
      const originalSchema = binding.control.schema;
      confirmation.request({
        catalogId: 'mixed',
        operation: 'typeChange',
        options: binding.control.uischema.options,
        config: jsonforms.config,
        discarded: numericIntent ? [] : [original],
        perform: () => {
          if (
            !binding.control.enabled ||
            !binding.control.visible ||
            binding.control.readonly ||
            binding.control.path !== originalPath ||
            binding.control.data !== original ||
            !isEqual(binding.control.schema, originalSchema) ||
            !isEqual(binding.control.rootSchema, rootSchema) ||
            (newIndex === null && !selection.clearable)
          )
            return;
          commit(newIndex);
        },
      });
    } finally {
      preparingTypeChange = false;
    }
  }

  function commit(newIndex: number | null) {
    const choice = newIndex === null ? undefined : selection.choices[newIndex].resolvedSchema;
    const nextType = choice?.type;
    selection.select(newIndex, typeof nextType === 'string' ? nextType : null);
    // Integer/Number are editing intents for the same JSON number value.
    if (
      (nextType === 'integer' || nextType === 'number') &&
      typeof binding.control.data === 'number'
    )
      return;

    const data = choice ? createDefaultValue(choice, binding.control.rootSchema) : undefined;
    binding.handleChange(binding.control.path, data);
  }
  return { confirmation, requestTypeChange };
}
