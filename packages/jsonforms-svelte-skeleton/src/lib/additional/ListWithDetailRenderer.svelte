<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    composePaths,
    createDefaultValue,
    findUISchema,
    getControlPath,
    type ControlElement,
  } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import { Avatar, Listbox, useListCollection } from '@skeletonlabs/skeleton-svelte';
  import {
    CheckIcon,
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    PlusIcon as PlusOutline,
    Trash2Icon as TrashBinOutline,
  } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useSkeletonArrayControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const binding = useSkeletonArrayControl(useJsonFormsArrayControl(props));

  let _selectedIndex = $state<number | undefined>(undefined);

  const selectedIndex = $derived.by(() => {
    const len = binding.control.data?.length ?? 0;
    if (_selectedIndex === undefined || _selectedIndex >= len) return undefined;
    return _selectedIndex;
  });

  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);

  const foundUISchema = $derived(
    findUISchema(
      binding.control.uischemas,
      binding.control.schema,
      binding.control.uischema.scope,
      binding.control.path,
      undefined,
      binding.control.uischema,
      binding.control.rootSchema,
    ),
  );

  const addDisabled = $derived(
    !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema?.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  function addButtonClick() {
    binding.addItem(
      binding.control.path,
      createDefaultValue(binding.control.schema, binding.control.rootSchema),
    )();
  }

  function moveUpClick(event: Event, toMove: number) {
    event.stopPropagation();
    binding.moveUp?.(binding.control.path, toMove)();
  }

  function moveDownClick(event: Event, toMove: number) {
    event.stopPropagation();
    binding.moveDown?.(binding.control.path, toMove)();
  }

  function removeItemsClick(event: Event, toDelete: number[]) {
    event.stopPropagation();
    binding.removeItems?.(binding.control.path, toDelete)();
  }

  function childErrors(index: number): ErrorObject[] {
    return binding.control.childErrors.filter((e) =>
      getControlPath(e).startsWith(composePaths(binding.control.path, `${index}`)),
    );
  }

  function childLabelForIndex(index: number): string {
    return binding.childLabelForIndex?.(index) || `Item ${index + 1}`;
  }

  type ListboxItem = {
    value: string;
    label: string;
    index: number;
  };

  const listboxItems = $derived(
    (binding.control.data ?? []).map(
      (_: unknown, index: number): ListboxItem => ({
        value: index.toString(),
        label: childLabelForIndex(index),
        index,
      }),
    ),
  );

  const collection = $derived(
    useListCollection({
      items: listboxItems,
      itemToString: (item) => item.label,
      itemToValue: (item) => item.value,
    }),
  );

  const listboxProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Listbox');
    return {
      ...skeletonProps,
      collection,
      value: selectedIndex !== undefined ? [selectedIndex.toString()] : [],
      onValueChange: (details: { value: string[] }) => {
        const val = details.value[0];
        _selectedIndex = val !== undefined ? Number(val) : undefined;
        skeletonProps.onValueChange?.(details);
      },
      class: twMerge(
        // Match the Flowbite layout: fixed-width master pane with bounded height
        // and its own scrollbar independent from the detail panel.
        'card preset-outlined-surface-200-800 min-h-64 max-h-96 min-w-[350px] max-w-[350px] shrink-0 overflow-y-auto',
        skeletonProps.class,
      ),
    };
  });

  const listboxItemProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Listbox.Item');
    return {
      ...skeletonProps,
      class: twMerge(
        'flex w-full min-w-0 cursor-pointer items-center gap-3 overflow-hidden border-b px-4 py-3 text-left last:border-b-0 data-highlighted:preset-tonal-primary data-selected:preset-tonal-primary',
        skeletonProps.class,
      ),
    };
  });
</script>

{#if binding.control.visible}
  <div class="flex h-full w-full flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2">
      <h3 class="text-lg font-semibold">
        {binding.computedLabel}
      </h3>
      <div class="flex items-center gap-2">
        {#if binding.control.childErrors.length > 0}
          <ValidationIcon errors={binding.control.childErrors} />
        {/if}
        <button
          type="button"
          class="btn btn-sm preset-filled"
          disabled={addDisabled}
          onclick={addButtonClick}
          aria-label={binding.control.translations?.addAriaLabel || 'Add item'}
          title={binding.control.translations?.addTooltip || 'Add item'}
        >
          <PlusOutline class="h-4 w-4" />
        </button>
      </div>
    </div>

    {#if dataLength === 0}
      <p class="text-surface-500 dark:text-surface-400 py-8 text-center">
        {binding.control.translations?.noDataMessage || 'No data'}
      </p>
    {:else}
      <!--
        gap-4 provides the visual separation between the constrained list and
        the detail panel. overflow-hidden on the row keeps both panels from
        overflowing their shared container.
      -->
      <div class="flex flex-1 gap-4 overflow-hidden p-4">
        <!-- Constrained, scrollable item list -->
        <Listbox {...listboxProps}>
          <Listbox.Content>
            {#each listboxItems as item (item.value)}
              <Listbox.Item {item} {...listboxItemProps}>
                <div class="relative shrink-0">
                  <ValidationBadge errors={childErrors(item.index)}>
                    <Avatar class="preset-filled-surface-500 size-10 rounded-full">
                      <Avatar.Fallback>{item.index + 1}</Avatar.Fallback>
                    </Avatar>
                  </ValidationBadge>
                </div>

                <div class="min-w-0 flex-1 overflow-hidden text-start">
                  <p class="truncate text-sm font-medium">{item.label}</p>
                </div>

                <Listbox.ItemIndicator class="shrink-0">
                  <CheckIcon class="size-4" />
                </Listbox.ItemIndicator>

                <div class="flex shrink-0 items-center gap-1">
                  {#if binding.appliedOptions.showSortButtons}
                    <button
                      type="button"
                      class="btn btn-sm preset-outlined"
                      disabled={item.index <= 0 || !binding.control.enabled}
                      onclick={(e: MouseEvent) => moveUpClick(e, item.index)}
                      aria-label={binding.control.translations?.upAriaLabel || 'Move up'}
                      title={binding.control.translations?.up || 'Move up'}
                    >
                      <ChevronUpOutline class="h-3 w-3" />
                    </button>

                    <button
                      type="button"
                      class="btn btn-sm preset-outlined"
                      disabled={item.index >= dataLength - 1 || !binding.control.enabled}
                      onclick={(e: MouseEvent) => moveDownClick(e, item.index)}
                      aria-label={binding.control.translations?.downAriaLabel || 'Move down'}
                      title={binding.control.translations?.down || 'Move down'}
                    >
                      <ChevronDownOutline class="h-3 w-3" />
                    </button>
                  {/if}

                  <button
                    type="button"
                    class="btn btn-sm preset-tonal hover:preset-filled-error-500"
                    disabled={!binding.control.enabled ||
                      (binding.appliedOptions.restrict &&
                        binding.control.arraySchema?.minItems !== undefined &&
                        dataLength <= binding.control.arraySchema.minItems)}
                    onclick={(e: MouseEvent) => removeItemsClick(e, [item.index])}
                    aria-label={binding.control.translations?.removeAriaLabel || 'Remove item'}
                    title={binding.control.translations?.removeTooltip || 'Remove item'}
                  >
                    <TrashBinOutline class="h-3 w-3" />
                  </button>
                </div>
              </Listbox.Item>
            {/each}
          </Listbox.Content>
        </Listbox>

        <!-- Detail panel — scrollable, fills remaining width -->
        <div class="flex-1 overflow-y-auto">
          {#if selectedIndex === undefined}
            <div class="flex h-full items-center justify-center">
              <p class="text-surface-500 dark:text-surface-400">
                {binding.control.translations?.noSelection || 'Select an item to view details'}
              </p>
            </div>
          {:else}
            <DispatchRenderer
              schema={binding.control.schema}
              uischema={foundUISchema}
              path={composePaths(binding.control.path, `${selectedIndex}`)}
              enabled={binding.control.enabled}
              renderers={binding.control.renderers}
              cells={binding.control.cells}
            />
          {/if}
        </div>
      </div>
    {/if}
  </div>
{/if}
