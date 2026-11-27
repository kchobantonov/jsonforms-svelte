import { composePaths, createDefaultValue } from '@jsonforms/core';
import type { ControlProps } from '../core/jsonFormsCompositions.svelte';
import { findDetailUISchema, unconstrainedArrayItem } from '../core/detail';
import { resolveArrayItemCollapsed } from '../layout/groupState.svelte';
import { useArrayCollection, type ArrayCollectionBinding } from './arrayCollection.svelte';
import { showArraySortButtons } from './arraySortOptions';

export function useArrayLayout(
  props: ControlProps,
  binding: ArrayCollectionBinding,
  getMultiple: () => boolean,
) {
  let accordionValue = $state<string[]>(
    resolveArrayItemCollapsed(binding.control.uischema.options, binding.control.config)
      ? []
      : ['item-0'],
  );
  const collection = useArrayCollection(props, binding, false);
  const { dataLength, addDisabled } = $derived(collection);
  const showSortButtons = $derived(showArraySortButtons(binding.appliedOptions));
  const foundUISchema = $derived(
    findDetailUISchema(
      binding.control.uischemas,
      binding.control.schema,
      binding.control.uischema.scope,
      binding.control.path,
      undefined,
      binding.control.uischema,
      binding.control.rootSchema,
    ),
  );

  const { runCollectionAction } = collection;

  function addButtonClick() {
    void runCollectionAction(
      () => !addDisabled,
      () => {
        const newIndex = dataLength;
        binding.addItem(
          binding.control.path,
          createDefaultValue(binding.control.schema, binding.control.rootSchema),
        )();
        const newKey = `item-${newIndex}`;
        if (binding.appliedOptions.collapseNewItems) {
          accordionValue = accordionValue.filter((key) => key !== newKey);
        } else {
          accordionValue = getMultiple() ? [...accordionValue, newKey] : [newKey];
        }
      },
    );
  }

  const { moveUpClick, moveDownClick, moveAction } = collection.moveButtons(
    () => !!showSortButtons,
    (from, to) => {
      accordionValue = accordionValue.map((key) =>
        key === `item-${from}` ? `item-${to}` : key === `item-${to}` ? `item-${from}` : key,
      );
    },
  );

  const { deletion, request } = collection.removal('arrayLayout', (indices) => {
    accordionValue = accordionValue.flatMap((key) => {
      const index = Number(key.slice('item-'.length));
      if (!key.startsWith('item-') || !Number.isInteger(index)) return [key];
      if (indices.includes(index)) return [];
      return [`item-${index - indices.filter((removed) => removed < index).length}`];
    });
    binding.removeItems?.(binding.control.path, indices)();
  });
  function removeItemsClick(indices: number[] | null) {
    if (indices) request(indices);
  }

  return {
    moveAction,
    deleteAction(index: number) {
      return {
        disabled: collection.removeDisabled,
        label: collection.arrayMessage('removeTooltip'),
        ariaLabel: collection.arrayMessage('removeAriaLabel'),
        onclick: (event: Event) => {
          event.stopPropagation();
          removeItemsClick([index]);
        },
      };
    },
    get addAction() {
      return {
        disabled: addDisabled,
        onclick: addButtonClick,
        ariaLabel: collection.arrayMessage('addAriaLabel'),
        label: collection.arrayMessage('addTooltip'),
      };
    },
    itemRenderer(index: number) {
      const control = binding.control;
      const item = unconstrainedArrayItem(control.schema, control.data[index]);
      return {
        schema: item.schema,
        uischema: item.uischema ?? foundUISchema,
        path: composePaths(control.path, String(index)),
        enabled: control.enabled,
        renderers: control.renderers,
        cells: control.cells,
      };
    },
    collection,
    deletion,
    addButtonClick,
    moveUpClick,
    moveDownClick,
    removeItemsClick,
    get foundUISchema() {
      return foundUISchema;
    },
    get hideAvatar() {
      return !!binding.appliedOptions.hideAvatar;
    },
    get showSortButtons() {
      return showSortButtons;
    },
    get expanded() {
      return accordionValue;
    },
    set expanded(value: string[]) {
      accordionValue = value;
    },
  };
}
