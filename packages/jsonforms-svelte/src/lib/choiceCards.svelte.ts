import { createDefaultValue, getI18nKey, type JsonSchema } from '@jsonforms/core';
import isEqual from 'lodash/isEqual';
import { untrack } from 'svelte';
import {
  useJsonFormsOneOfControl,
  useTranslator,
  type ControlProps,
} from './jsonFormsCompositions.svelte';
import { cardDiscriminatorIndex, resolveCardChoices } from './choiceCards';
import { branchChangeData, discardedByBranchChange } from './combinators';
import { confirmationRequired, resolveConfirmationPolicy } from './confirmation';

/** Shared state for native card/radio adapters. Dialog and card visuals belong to the UI family. */
export function useChoiceCards(props: ControlProps) {
  const binding = useJsonFormsOneOfControl(props);
  const t = useTranslator();
  const control = $derived(binding.control);
  const model = $derived(
    resolveCardChoices(
      control.schema,
      control.uischema,
      control.path,
      control.rootSchema,
      control.uischemas,
    ),
  );
  let chosen = $state<number | undefined>();
  let pending = $state<number | undefined>();
  const enabled = $derived(control.enabled && !control.readonly);
  const discriminator = $derived(
    cardDiscriminatorIndex(
      model.choices.flatMap((choice) => (choice.schema ? [choice.schema] : [])),
      control.data,
    ),
  );
  const selected = $derived(
    model.branchMode
      ? discriminator >= 0
        ? discriminator
        : (chosen ?? control.indexOfFittingSchema ?? -1)
      : model.values.findIndex((value) => isEqual(value, control.data)),
  );
  const choices = $derived(
    model.choices.map((choice, index) => {
      const fallback =
        choice.label ?? control.schema.oneOf?.[index]?.title ?? String(model.values[index]);
      return {
        ...choice,
        label: t.value(
          choice.i18n
            ? `${choice.i18n}.label`
            : getI18nKey(control.schema, control.uischema, control.path, `choices.${index}.label`),
          fallback,
        ),
      };
    }),
  );

  // Mapper results can be recreated after data edits. Reset only for a changed
  // editor schema/path, not an equivalent mapped object.
  let previousSchema: JsonSchema | undefined;
  let previousPath: string | undefined;
  $effect(() => {
    const schema = control.schema;
    const path = control.path;
    untrack(() => {
      if (path !== previousPath || !isEqual(schema, previousSchema)) {
        chosen = undefined;
        pending = undefined;
      }
      previousSchema = schema;
      previousPath = path;
    });
  });

  function commit(index: number) {
    if (!enabled || choices[index]?.disabled || !choices[index]) return;
    if (model.branchMode) {
      const branch = choices[index].schema;
      if (!branch) return;
      chosen = index;
      binding.handleChange(
        control.path,
        branchChangeData(
          control.data,
          createDefaultValue(branch, control.rootSchema),
          control.schema,
        ),
      );
    } else binding.handleChange(control.path, model.values[index]);
    pending = undefined;
  }

  function select(index: number) {
    if (!enabled || index === selected || !choices[index] || choices[index].disabled) return;
    if (model.branchMode) {
      const policy = resolveConfirmationPolicy({
        options: control.uischema.options,
        config: control.config,
        catalogId: 'oneOf',
        operation: 'branchChange',
      });
      const resolvedSchema = {
        ...control.schema,
        oneOf: model.choices.flatMap((choice) => (choice.schema ? [choice.schema] : [])),
      } as JsonSchema;
      if (
        confirmationRequired(policy, [
          discardedByBranchChange(control.data, resolvedSchema, policy === 'complex'),
        ])
      ) {
        pending = index;
        return;
      }
    }
    commit(index);
  }

  return {
    binding,
    get choices() {
      return choices;
    },
    get selected() {
      return selected;
    },
    get enabled() {
      return enabled;
    },
    get branchMode() {
      return model.branchMode;
    },
    get pending() {
      return pending;
    },
    select,
    confirm: () => {
      if (pending !== undefined) commit(pending);
    },
    cancel: () => {
      pending = undefined;
    },
  };
}
