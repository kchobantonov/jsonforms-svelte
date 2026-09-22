import { useTranslator } from './jsonFormsCompositions.svelte';
import { tupleInitialValue } from './tuple';
import type { AdditionalItemsProps } from './tuplePresentation';

/** Shared tuple-tail mutations; each renderer set owns its presentation. */
export function useAdditionalItems(props: AdditionalItemsProps) {
  const t = useTranslator();
  const control = $derived(props.binding.control);
  const options = $derived({ ...control.config, ...control.uischema.options });
  const data = $derived(Array.isArray(control.data) ? control.data : []);
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
    if (!canAdd || !props.definition) return;
    const next = [...data];
    for (let i = next.length; i < props.definition.prefix.length; i++) {
      const initial = tupleInitialValue(props.definition.prefix[i], control.rootSchema);
      if (initial === undefined) {
        message = t.value('tuple.missingPosition', 'Enter Item ' + (i + 1) + ' first.', {
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
      message = t.value(
        'tuple.initialType',
        'The additional item needs an explicit default or type.',
      );
      return;
    }
    next.push(initial === undefined ? '' : initial);
    message = undefined;
    props.binding.handleChange(control.path, next);
  }
  function remove(index: number) {
    if (!canDelete || !props.definition || index < props.definition.prefix.length) return;
    props.binding.handleChange(
      control.path,
      data.filter((_: unknown, i: number) => i !== index),
    );
  }

  return {
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
