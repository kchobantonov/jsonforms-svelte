import { useCollectionAction } from './collectionAction.svelte';
import { useDeletionConfirmation } from './deletionConfirmation.svelte';
import { getContext } from 'svelte';
import { update } from '@jsonforms/core';
import { CollectionIdentityContextSymbol, CollectionIdentityStore } from './collectionIdentity';
import { useDispatch, useJsonForms } from './jsonFormsCompositions.svelte';
import { collectionErrorPositions } from './collectionPagination';
import { useRendererMessages } from './rendererMessages.svelte';
import { useCollectionPagination } from './collectionPagination.svelte';
import { tupleInitialValue } from './tuple';
import { dataPathToPointer } from './dataPath';
import type { AdditionalItemsProps } from './tuplePresentation';

/** Shared tuple-tail mutations; each renderer set owns its presentation. */
export function useAdditionalItems(props: AdditionalItemsProps) {
  const messageFor = useRendererMessages();
  const form = useJsonForms();
  const dispatch = useDispatch();
  const identities =
    getContext<CollectionIdentityStore | undefined>(CollectionIdentityContextSymbol) ??
    new CollectionIdentityStore();
  const control = $derived(props.binding.control);
  const options = $derived({ ...control.config, ...control.uischema.options });
  const extendedOptions = $derived(
    control.config?.jsonformsExtended as Record<string, unknown> | undefined,
  );
  const data = $derived(Array.isArray(control.data) ? control.data : []);
  const modernForbiddenTail = $derived(
    props.definition.tail === false &&
      Array.isArray((control.schema as { prefixItems?: unknown }).prefixItems) &&
      (control.schema as { items?: unknown }).items === false,
  );
  const forbiddenTailErrors = $derived(
    [
      ...(form.core?.validationMode === 'NoValidation' ||
      form.core?.validationMode === 'ValidateAndHide'
        ? []
        : (form.core?.errors ?? [])),
      ...(form.core?.additionalErrors ?? []),
    ].filter(
      (error) =>
        (error.keyword === 'additionalItems' ||
          (modernForbiddenTail && error.keyword === 'items')) &&
        error.instancePath === dataPathToPointer(control.path),
    ),
  );
  const rowKeys = $derived(identities.keys(data));
  const tailErrorPositions = $derived(
    collectionErrorPositions(
      form.core,
      control.path,
      data
        .slice(props.definition.prefix.length)
        .map((_, index) => props.definition.prefix.length + index),
    ),
  );
  const page = useCollectionPagination({
    get keys() {
      return rowKeys.slice(props.definition.prefix.length);
    },
    get local() {
      return (control.uischema.options?.additionalItems as { pagination?: unknown } | undefined)
        ?.pagination;
    },
    get config() {
      return control.config;
    },
    get errors() {
      return tailErrorPositions;
    },
    kind: 'additionalItems',
  });
  const deletion = useDeletionConfirmation(
    () => ({ ...control, options: control.uischema.options }),
    'additionalItems',
    page.prepare,
  );
  const command = useCollectionAction(() => control, page.prepare);
  const restricted = $derived(options.restrict !== false);
  const enabled = $derived(control.enabled && !control.readonly);
  const canAdd = $derived(
    enabled &&
      !options.disableAdd &&
      props.definition?.tail !== false &&
      (!restricted ||
        control.schema.maxItems === undefined ||
        Math.max(data.length, props.definition?.prefix.length ?? 0) < control.schema.maxItems),
  );
  const canDelete = $derived(
    enabled &&
      !options.disableRemove &&
      (!restricted ||
        control.schema.minItems === undefined ||
        data.length > control.schema.minItems),
  );
  let message = $state<string | undefined>();
  function add() {
    return command(() => canAdd && !!props.definition, append);
  }
  function append() {
    const next = [...data];
    for (let i = next.length; i < props.definition.prefix.length; i++) {
      const initial = tupleInitialValue(props.definition.prefix[i], control.rootSchema);
      if (initial === undefined) {
        message = messageFor('tuple.missingPosition', {
          position: i + 1,
        });
        return;
      }
      next.push(initial);
    }
    const tail = props.definition.tail;
    const initial = tupleInitialValue(tail, control.rootSchema);
    // An unconstrained tail explicitly starts as a string, with the mixed
    // renderer allowing its type to be changed.
    if (
      initial === undefined &&
      tail !== true &&
      !(typeof tail === 'object' && Object.keys(tail).length === 0)
    ) {
      message = messageFor('tuple.initialType');
      return;
    }
    next.push(initial === undefined ? '' : initial);
    message = undefined;
    dispatch(update(control.path, () => next, { type: 'ADD', values: next.slice(data.length) }));
  }
  function remove(index: number) {
    deletion.request(
      () => [data[index]],
      () =>
        dispatch(
          update(control.path, () => data.filter((_: unknown, i: number) => i !== index), {
            type: 'REMOVE',
            indices: [index],
          }),
        ),
      () =>
        canDelete &&
        Number.isInteger(index) &&
        index >= props.definition.prefix.length &&
        index < data.length,
    );
  }

  return {
    get pending() {
      return deletion.pending;
    },
    get accept() {
      return deletion.accept;
    },
    get cancel() {
      return deletion.cancel;
    },
    page,
    get rowKeys() {
      return rowKeys;
    },
    get data() {
      return data;
    },
    get forbiddenTailErrors() {
      return forbiddenTailErrors;
    },
    get tailErrorCount() {
      return tailErrorPositions.reduce((count, position) => count + position.count, 0);
    },
    get firstInvalidTailOffset() {
      return tailErrorPositions[0]?.index;
    },
    get showTailSummary() {
      return (
        (control.uischema.options?.showValidationIndicator ??
          extendedOptions?.showValidationIndicator) !== false &&
        (control.uischema.options?.hideArraySummaryValidation ??
          extendedOptions?.hideArraySummaryValidation) !== true
      );
    },
    get showTailSummaryCount() {
      return (
        (control.uischema.options?.showValidationIndicatorCount ??
          extendedOptions?.showValidationIndicatorCount) === true
      );
    },
    get canAdd() {
      return canAdd;
    },
    get canDelete() {
      return canDelete;
    },
    get message() {
      return message;
    },
    add,
    remove,
  };
}
