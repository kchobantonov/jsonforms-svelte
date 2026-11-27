import { useArrayCollection, type ArrayCollectionBinding } from './arrayCollection.svelte';
import { tick } from 'svelte';
import { createDefaultValue } from '@jsonforms/core';
import type { ControlProps } from '../core/jsonFormsCompositions.svelte';
import { firstAddedCollectionIndex } from './collectionPagination';

export function useListWithDetail(props: ControlProps, binding: ArrayCollectionBinding) {
  const collection = useArrayCollection(props, binding, false);
  const { panel, page, childErrors, childLabelForIndex } = collection;
  const { dataLength, headerErrors, addDisabled } = $derived(collection);
  let selectedKey = $state<string | undefined>(undefined);
  const selectedIndex = $derived.by(() => {
    const index = selectedKey === undefined ? -1 : binding.control.rowKeys.indexOf(selectedKey);
    return index < 0 ? undefined : index;
  });

  const items = $derived(
    (binding.control.data ?? []).map((_: unknown, index: number) => ({
      value: binding.control.rowKeys[index],
      label: childLabelForIndex(index),
      index,
    })),
  );

  $effect(() => {
    if (selectedKey !== undefined && !binding.control.rowKeys.includes(selectedKey))
      selectedKey = undefined;
  });

  // Methods
  const { runCollectionAction } = collection;

  async function addButtonClick() {
    const previousKeys = [...binding.control.rowKeys];
    let added = false;
    await runCollectionAction(
      () => !addDisabled,
      () => {
        binding.addItem(
          binding.control.path,
          createDefaultValue(binding.control.schema, binding.control.rootSchema),
        )();
        added = true;
      },
    );
    if (!added) return;
    await tick();
    const key =
      binding.control.rowKeys[firstAddedCollectionIndex(previousKeys, binding.control.rowKeys)];
    if (key) selectedKey = key;
  }

  const { moveUpClick, moveDownClick, moveAction } = collection.moveButtons(
    () => !!binding.appliedOptions.showSortButtons,
  );

  const { deletion, removeItemsClick } = collection.removal('listWithDetail', (indices) =>
    binding.removeItems?.(binding.control.path, indices)(),
  );

  return {
    arrayMessage: collection.arrayMessage,
    rowAction(index: number, action: 'up' | 'down' | 'remove') {
      if (action === 'remove')
        return {
          disabled: collection.removeDisabled,
          onclick: (event: Event) => removeItemsClick(event, [index]),
          label: collection.arrayMessage('removeTooltip'),
          ariaLabel: collection.arrayMessage('removeAriaLabel'),
        };
      return moveAction(index, action);
    },
    get visibleItems() {
      return page.indices.map((index) => items[index]);
    },
    get items() {
      return items;
    },
    get removeDisabled() {
      return collection.removeDisabled;
    },
    panel,
    page,
    deletion,
    addButtonClick,
    moveUpClick,
    moveDownClick,
    removeItemsClick,
    childErrors,
    childLabelForIndex,
    get selectedIndex() {
      return selectedIndex;
    },
    get dataLength() {
      return dataLength;
    },
    get headerErrors() {
      return headerErrors;
    },
    get addDisabled() {
      return addDisabled;
    },
    get selectedKey() {
      return selectedKey;
    },
    set selectedKey(key: string | undefined) {
      selectedKey = key;
    },
  };
}
