import { useDeletionConfirmation } from './deletionConfirmation.svelte';
import { useJsonForms } from './jsonFormsCompositions.svelte';
import { collectionErrorPositions } from './collectionPagination';
import { useRendererMessages } from './rendererMessages.svelte';
import { useCollectionPagination } from './collectionPagination.svelte';
import { tupleInitialValue } from './tuple';
import type { AdditionalItemsProps } from './tuplePresentation';

/** Shared tuple-tail mutations; each renderer set owns its presentation. */
export function useAdditionalItems(props: AdditionalItemsProps) {
  const messageFor = useRendererMessages();
  const form = useJsonForms();
  const control = $derived(props.binding.control);
  const options = $derived({ ...control.config, ...control.uischema.options });
  const data = $derived(Array.isArray(control.data) ? control.data : []);
  const page = useCollectionPagination({
    get keys() {
      return data
        .slice(props.definition.prefix.length)
        .map((_, index) => props.definition.prefix.length + index);
    },
    get local() {
      return (control.uischema.options?.additionalItems as { pagination?: unknown } | undefined)
        ?.pagination;
    },
    get config() {
      return control.config;
    },
    get errors() {
      return collectionErrorPositions(
        form.core,
        control.path,
        data
          .slice(props.definition.prefix.length)
          .map((_, index) => props.definition.prefix.length + index),
      );
    },
    kind: 'additionalItems',
  });
  const deletion = useDeletionConfirmation(
    () => ({ ...control, options: control.uischema.options }),
    'additionalItems',
    page.prepare,
  );
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
    if (!canAdd || !props.definition || !page.prepare() || !canAdd) return;
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
    props.binding.handleChange(control.path, next);
  }
  function remove(index: number) {
    deletion.request(
      () => [data[index]],
      () =>
        props.binding.handleChange(
          control.path,
          data.filter((_: unknown, i: number) => i !== index),
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
    accept: deletion.accept,
    cancel: deletion.cancel,
    page,
    get data() {
      return data;
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
