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
  import * as Avatar from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import * as Item from '$lib/components/ui/item';
  import {
    CheckIcon,
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    PlusIcon as PlusOutline,
    Trash2Icon as TrashBinOutline,
  } from '$lib/components/icons';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useShadcnArrayControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const binding = useShadcnArrayControl(useJsonFormsArrayControl(props));

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
</script>

{#if binding.control.visible}
  <div class="flex h-full w-full flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2">
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-semibold">
          {binding.computedLabel}
        </h3>
        {#if binding.control.childErrors.length > 0 && !binding.appliedOptions.hideArraySummaryValidation}
          <ValidationIcon errors={binding.control.childErrors} />
        {/if}
      </div>
      <div class="flex items-center gap-2">
        <Button
          size="icon-sm"
          disabled={addDisabled}
          onclick={addButtonClick}
          aria-label={binding.control.translations?.addAriaLabel || 'Add item'}
          title={binding.control.translations?.addTooltip || 'Add item'}
        >
          <PlusOutline class="h-4 w-4" />
        </Button>
      </div>
    </div>

    {#if dataLength === 0}
      <p class="text-muted-foreground py-8 text-center">
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
        <div
          role="listbox"
          aria-label={binding.computedLabel}
          class="border-border max-h-96 min-h-64 max-w-[350px] min-w-[350px] shrink-0 overflow-y-auto rounded-lg border p-1"
          {...binding.shadcnProps('Item.Group')}
        >
          {#each listboxItems as item (item.value)}
            <Item.Root
              role="option"
              tabindex={0}
              aria-selected={selectedIndex === item.index}
              variant={selectedIndex === item.index ? 'muted' : 'default'}
              class="cursor-pointer flex-nowrap"
              onclick={() => (_selectedIndex = item.index)}
              onkeydown={(event: KeyboardEvent) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  _selectedIndex = item.index;
                }
              }}
              {...binding.shadcnProps('Item')}
            >
              <div class="relative shrink-0">
                <ValidationBadge border errors={childErrors(item.index)}>
                  <Avatar.Root size="lg" class="bg-muted">
                    <Avatar.Fallback>{item.index + 1}</Avatar.Fallback>
                  </Avatar.Root>
                </ValidationBadge>
              </div>

              <Item.Content>
                <Item.Title class="truncate">{item.label}</Item.Title>
              </Item.Content>

              {#if selectedIndex === item.index}
                <CheckIcon class="size-4" />
              {/if}

              <div class="flex shrink-0 items-center gap-1">
                {#if binding.appliedOptions.showSortButtons}
                  <Button
                    variant="outline"
                    size="icon-xs"
                    disabled={item.index <= 0 || !binding.control.enabled}
                    onclick={(e: MouseEvent) => moveUpClick(e, item.index)}
                    aria-label={binding.control.translations?.upAriaLabel || 'Move up'}
                    title={binding.control.translations?.up || 'Move up'}
                  >
                    <ChevronUpOutline class="h-3 w-3" />
                  </Button>

                  <Button
                    variant="outline"
                    size="icon-xs"
                    disabled={item.index >= dataLength - 1 || !binding.control.enabled}
                    onclick={(e: MouseEvent) => moveDownClick(e, item.index)}
                    aria-label={binding.control.translations?.downAriaLabel || 'Move down'}
                    title={binding.control.translations?.down || 'Move down'}
                  >
                    <ChevronDownOutline class="h-3 w-3" />
                  </Button>
                {/if}

                <Button
                  variant="destructive"
                  size="icon-xs"
                  disabled={!binding.control.enabled ||
                    (binding.appliedOptions.restrict &&
                      binding.control.arraySchema?.minItems !== undefined &&
                      dataLength <= binding.control.arraySchema.minItems)}
                  onclick={(e: MouseEvent) => removeItemsClick(e, [item.index])}
                  aria-label={binding.control.translations?.removeAriaLabel || 'Remove item'}
                  title={binding.control.translations?.removeTooltip || 'Remove item'}
                >
                  <TrashBinOutline class="h-3 w-3" />
                </Button>
              </div>
            </Item.Root>
          {/each}
        </div>

        <!-- Detail panel — scrollable, fills remaining width -->
        <div class="flex-1 overflow-y-auto">
          {#if selectedIndex === undefined}
            <div class="flex h-full items-center justify-center">
              <p class="text-muted-foreground">
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
