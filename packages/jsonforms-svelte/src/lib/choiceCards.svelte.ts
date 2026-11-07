import { createDefaultValue, getI18nKey, type JsonSchema } from '@jsonforms/core';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';
import { untrack } from 'svelte';
import {
  useJsonFormsOneOfControl,
  useTranslator,
  type ControlProps,
} from './jsonFormsCompositions.svelte';
import { cardDiscriminatorIndex, resolveCardChoices } from './choiceCards';
import { branchChangeData, discardedByBranchChange } from './combinators';
import { usePendingControlAction } from './detailDialog.svelte';
import { confirmationRequired, resolveConfirmationPolicy } from './confirmation';
import { useUIDiagnosticReporter } from './authorDiagnostic.svelte';

/** Shared state for native card/radio adapters. Dialog and card visuals belong to the UI family. */
export function useChoiceCards(props: ControlProps) {
  const binding = useJsonFormsOneOfControl(props);
  const reportDiagnostic = useUIDiagnosticReporter();
  const t = useTranslator();
  const prepareAction = usePendingControlAction();
  let selecting = $state(false);
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
  // These sets deduplicate author warnings and must not become effect dependencies.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  let reportedDiagnostics = new Set<string>();
  $effect(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const active = new Set<string>();
    for (const diagnostic of model.diagnostics) {
      const key = JSON.stringify([control.path, diagnostic.index, diagnostic.code]);
      active.add(key);
      if (reportedDiagnostics.has(key)) continue;
      reportedDiagnostics.add(key);
      reportDiagnostic(diagnostic.code, {
        severity: 'warning',
        message:
          diagnostic.code === 'choice.invalidIdentifier'
            ? 'The choice identifier does not match a selectable value or branch.'
            : 'Several authored choices identify the same selectable value or branch.',
        path: control.path,
        details: { index: diagnostic.index },
      });
    }
    reportedDiagnostics = active;
  });
  let chosen = $state<number | undefined>();
  let pending = $state.raw<{
    index: number;
    data: unknown;
    schema: JsonSchema;
    rootSchema: JsonSchema;
    path: string;
  }>();
  const enabled = $derived(control.enabled && control.visible && !control.readonly);
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

  function currentRequest() {
    return (
      pending !== undefined &&
      enabled &&
      control.visible &&
      pending.path === control.path &&
      isEqual(pending.schema, control.schema) &&
      isEqual(pending.rootSchema, control.rootSchema) &&
      isEqual(pending.data, control.data) &&
      !choices[pending.index]?.disabled
    );
  }
  $effect(() => {
    if (pending && !currentRequest()) pending = undefined;
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

  async function select(index: number) {
    if (selecting || !enabled || index === selected || !choices[index] || choices[index].disabled)
      return;
    const path = control.path;
    const schema = control.schema;
    const rootSchema = control.rootSchema;
    const initialData = cloneDeep(control.data);
    const sameTarget = () =>
      enabled &&
      control.visible &&
      path === control.path &&
      isEqual(schema, control.schema) &&
      isEqual(rootSchema, control.rootSchema);
    let flushedData: unknown;
    selecting = true;
    try {
      if (
        !(await prepareAction(
          () => sameTarget() && isEqual(control.data, initialData),
          () => {
            flushedData = cloneDeep(control.data);
            return () => sameTarget() && isEqual(control.data, flushedData);
          },
        )) ||
        !sameTarget() ||
        !isEqual(control.data, flushedData) ||
        index === selected ||
        !choices[index] ||
        choices[index].disabled
      )
        return;

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
          pending = {
            index,
            data: cloneDeep(control.data),
            schema: cloneDeep(control.schema),
            rootSchema: cloneDeep(control.rootSchema),
            path: control.path,
          };
          return;
        }
      }
      commit(index);
    } finally {
      selecting = false;
    }
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
    get selecting() {
      return selecting;
    },
    get pending() {
      return pending?.index;
    },
    select,
    confirm: () => {
      const index = pending?.index;
      const valid = currentRequest();
      pending = undefined;
      if (valid && index !== undefined) commit(index);
    },
    cancel: () => {
      pending = undefined;
    },
  };
}
