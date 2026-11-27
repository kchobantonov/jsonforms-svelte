import { dataPathSegments } from '../core/dataPath';
import { scopeDataSegments } from '../core/schemaScope';
import { scalarCompositionProps } from './scalarComposition';
import { useRendererMessages } from '../locale/rendererMessages.svelte';
import { showAdditionalPropertyEditor } from '../objects/additionalPropertySchema';
import {
  createCombinatorRenderInfos,
  createDefaultValue,
  type CombinatorSubSchemaRenderInfo,
  type JsonSchema,
} from '@jsonforms/core';
import { useJsonForms, useTranslator } from '@chobantonov/jsonforms-svelte';
import type { ControlProps, useJsonFormsOneOfControl } from '../core/jsonFormsCompositions.svelte';
import {
  branchChangeData,
  clearedBranchValue,
  isArrayItemPath,
  discardedByBranchChange,
} from './combinators';
import {
  missingDiscriminatorError,
  discriminatorBranch,
  initialOneOfBranch,
} from './discriminatorBranch';
import { confirmationRequired, resolveConfirmationPolicy } from '../interaction/confirmation';
import { useBranchChange } from './prepareBranchChange.svelte';
import { untrack } from 'svelte';
import isEqual from 'lodash/isEqual';
import cloneDeep from 'lodash/cloneDeep';

export function useOneOfSelection(
  props: ControlProps,
  binding: Pick<ReturnType<typeof useJsonFormsOneOfControl>, 'control' | 'handleChange'> & {
    appliedOptions: Record<string, unknown>;
    controlWrapper: { errors?: string };
  },
) {
  const form = useJsonForms();
  const controlPathSegments = $derived([
    ...(props.pathSegments ?? dataPathSegments(props.path)),
    ...scopeDataSegments(props.uischema.scope),
  ]);

  const scalarControl = $derived(scalarCompositionProps(binding.control));

  const message = useRendererMessages();
  const selectionError = $derived(
    missingDiscriminatorError(
      binding.control.schema,
      binding.control.rootSchema,
      controlPathSegments,
      [
        ...(form.core?.validationMode === 'NoValidation' ||
        form.core?.validationMode === 'ValidateAndHide'
          ? []
          : (form.core?.errors ?? [])),
        ...(form.core?.additionalErrors ?? []),
      ],
    )
      ? message('oneOf.chooseKind')
      : '',
  );
  const selectorErrors = $derived(
    [binding.controlWrapper.errors, selectionError].filter(Boolean).join('\n'),
  );

  const t = useTranslator();
  const oneOfRenderInfos = $derived.by(
    (): (CombinatorSubSchemaRenderInfo & {
      index: number;
    })[] => {
      const result = createCombinatorRenderInfos(
        binding.control.schema.oneOf ?? [],
        binding.control.rootSchema,
        'oneOf',
        binding.control.uischema,
        binding.control.path,
        binding.control.uischemas,
      );

      return result.map((info, index) => ({ ...info, index: index }));
    },
  );

  const discriminatorIndex = $derived(
    discriminatorBranch(
      binding.control.schema,
      binding.control.rootSchema,
      'oneOf',
      binding.control.data,
    ),
  );
  const fittingIndex = $derived(discriminatorIndex ?? binding.control.indexOfFittingSchema);
  let userChosen = $state(false);
  let chosenIndex = $state<number | null>(
    untrack(() => initialOneOfBranch(binding.control.data, fittingIndex, oneOfRenderInfos.length)),
  );
  $effect(() => {
    const next = initialOneOfBranch(binding.control.data, fittingIndex, oneOfRenderInfos.length);
    if (userChosen && discriminatorIndex !== undefined && discriminatorIndex === chosenIndex)
      userChosen = false;
    if (
      next === null &&
      (!userChosen || binding.control.data === undefined || chosenIndex === null)
    ) {
      userChosen = false;
      chosenIndex = null;
      dialog = false;
    } else if (
      (!userChosen && fittingIndex !== undefined && fittingIndex >= 0) ||
      (chosenIndex !== null && chosenIndex >= oneOfRenderInfos.length)
    ) {
      chosenIndex = next;
    }
  });

  const selectedIndex = $derived(oneOfRenderInfos.length === 1 ? 0 : chosenIndex);

  const prepareChange = useBranchChange(() => binding.control);
  let pendingTarget = $state.raw<{
    data: unknown;
    schema: unknown;
    rootSchema: unknown;
    path: string;
  }>();
  const currentTarget = () =>
    pendingTarget !== undefined &&
    binding.control.enabled &&
    !binding.control.readonly &&
    binding.control.visible &&
    pendingTarget.path === binding.control.path &&
    isEqual(pendingTarget.schema, binding.control.schema) &&
    isEqual(pendingTarget.rootSchema, binding.control.rootSchema) &&
    isEqual(pendingTarget.data, binding.control.data);
  $effect(() => {
    if (dialog && !currentTarget()) dialog = false;
  });

  let newSelectedIndex = $state<number | null>(null);
  let dialog = $state(false);

  const selectItems = $derived(
    oneOfRenderInfos.map((item) => ({
      value: item.index.toString(),
      name: t.value(
        typeof (item.schema as { i18n?: string }).i18n === 'string'
          ? `${(item.schema as { i18n: string }).i18n}.label`
          : item.label,
        item.label,
      ),
    })),
  );

  function openNewTab(newIndex: number | null): void {
    untrack(() => {
      if (!binding.control.enabled || binding.control.readonly) return;
      if (newIndex !== null && (!Number.isInteger(newIndex) || !oneOfRenderInfos[newIndex])) return;
      const defaults =
        newIndex === null
          ? clearedBranchValue(
              isArrayItemPath(form.core?.data, binding.control.path),
              oneOfRenderInfos.map((info) => info.schema),
            )
          : createDefaultValue(oneOfRenderInfos[newIndex].schema, binding.control.rootSchema);
      binding.handleChange(
        binding.control.path,
        branchChangeData(binding.control.data, defaults, binding.control.schema),
      );
      chosenIndex = newIndex;
    });
  }

  function requestBranchChange(next: number | null) {
    return prepareChange(() => {
      if (next === selectedIndex) return;
      if (next !== null && (!Number.isInteger(next) || !oneOfRenderInfos[next])) return;
      newSelectedIndex = next;
      const policy = resolveConfirmationPolicy({
        catalogId: 'oneOf',
        operation: 'branchChange',
        config: binding.control.config,
        options: binding.control.uischema.options,
      });
      const branchSchema = {
        ...binding.control.schema,
        oneOf: oneOfRenderInfos.map((info) => info.schema),
      } as JsonSchema;
      if (
        confirmationRequired(policy, [
          discardedByBranchChange(binding.control.data, branchSchema, policy === 'complex'),
        ])
      ) {
        pendingTarget = {
          data: cloneDeep(binding.control.data),
          schema: cloneDeep(binding.control.schema),
          rootSchema: cloneDeep(binding.control.rootSchema),
          path: binding.control.path,
        };
        dialog = true;
      } else {
        userChosen = true;
        openNewTab(next);
      }
    });
  }

  function confirm(): void {
    const valid = dialog && currentTarget();
    dialog = false;
    pendingTarget = undefined;
    if (valid) {
      userChosen = true;
      openNewTab(newSelectedIndex);
    }
  }

  function cancel(): void {
    pendingTarget = undefined;
    dialog = false;
  }

  const selectedSchema = $derived(
    selectedIndex === null ? undefined : oneOfRenderInfos[selectedIndex]?.schema,
  );
  const allowWhenMissing = $derived(binding.appliedOptions.allowAdditionalPropertiesIfMissing);
  return {
    get showAdditionalProperties() {
      return showAdditionalPropertyEditor(binding.control.schema, allowWhenMissing);
    },
    get showOneOfAdditionalProperties() {
      return (
        selectedIndex !== null && showAdditionalPropertyEditor(selectedSchema, allowWhenMissing)
      );
    },
    get oneOfReservedPropertyNames() {
      return Object.keys(selectedSchema?.properties ?? {});
    },
    get scalarControl() {
      return scalarControl;
    },
    get controlPathSegments() {
      return controlPathSegments;
    },
    get selectorErrors() {
      return selectorErrors;
    },
    get oneOfRenderInfos() {
      return oneOfRenderInfos;
    },
    get selectItems() {
      return selectItems;
    },
    get selectedIndex() {
      return selectedIndex;
    },
    get dialog() {
      return dialog;
    },
    set dialog(open: boolean) {
      dialog = open;
    },
    message,
    clear() {
      requestBranchChange(null);
    },
    handleDialogKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancel();
      }
    },
    requestBranchChange,
    confirm,
    cancel,
  };
}
