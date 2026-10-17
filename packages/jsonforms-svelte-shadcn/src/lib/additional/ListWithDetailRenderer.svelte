<script lang="ts">
  import { useDeletionConfirmation } from '@chobantonov/jsonforms-svelte';
  import ConfirmationDialog from '../complex/components/ConfirmationDialog.svelte';
  import { findDetailUISchema } from '@chobantonov/jsonforms-svelte';
  import {
    DispatchRenderer,
    useJsonForms,
    useCollectionPagination,
    collectionErrorPositions,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    composePaths,
    createDefaultValue,
    getControlPath,
    type ControlElement,
  } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import * as Avatar from '@jsonforms-svelte-shadcn-ui/avatar';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Item from '@jsonforms-svelte-shadcn-ui/item';
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

  import CollectionPager from '../components/CollectionPager.svelte';
  const jsonforms = useJsonForms();

  const props: RendererProps<ControlElement> = $props();
  const binding = useShadcnArrayControl(useJsonFormsArrayControl(props));

  let _selectedIndex = $state<number | undefined>(undefined);

  const selectedIndex = $derived.by(() => {
    const len = binding.control.data?.length ?? 0;
    if (_selectedIndex === undefined || _selectedIndex >= len) return undefined;
    return _selectedIndex;
  });

  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);
  const keys = $derived(Array.from({ length: dataLength }, (_, index) => index));
  const page = useCollectionPagination({
    get keys() {
      return keys;
    },
    get local() {
      return binding.control.uischema.options?.pagination;
    },
    get config() {
      return binding.control.config;
    },
    get errors() {
      return collectionErrorPositions(jsonforms.core, binding.control.path, keys);
    },
    kind: 'array',
    defaultEnabled: false,
  });

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

  const addDisabled = $derived(
    binding.appliedOptions.disableAdd === true ||
      !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema?.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  function addButtonClick() {
    if (addDisabled || !page.prepare() || addDisabled) return;
    binding.addItem(
      binding.control.path,
      createDefaultValue(binding.control.schema, binding.control.rootSchema),
    )();
  }

  function moveUpClick(event: Event, toMove: number) {
    event.stopPropagation();
    if (!binding.control.enabled || toMove <= 0 || !page.prepare()) return;
    binding.moveUp?.(binding.control.path, toMove)();
  }

  function moveDownClick(event: Event, toMove: number) {
    event.stopPropagation();
    if (!binding.control.enabled || toMove >= dataLength - 1 || !page.prepare()) return;
    binding.moveDown?.(binding.control.path, toMove)();
  }

  const deletion = useDeletionConfirmation(
    () => ({
      ...binding.control,
      options: binding.control.uischema.options,
    }),
    'listWithDetail',
    () => page.prepare(),
  );

  function removeItemsClick(event: Event, toDelete: number[]) {
    event.stopPropagation();
    const indices = [...new Set(toDelete)].filter(
      (index) => Number.isInteger(index) && index >= 0 && index < dataLength,
    );
    const allowed = () =>
      indices.length > 0 &&
      binding.appliedOptions.disableRemove !== true &&
      (!binding.appliedOptions.restrict ||
        dataLength - indices.length >= (binding.control.arraySchema?.minItems ?? 0));
    deletion.request(
      () => indices.map((index) => binding.control.data[index]),
      () => binding.removeItems?.(binding.control.path, indices)(),
      allowed,
    );
  }

  function childErrors(index: number): ErrorObject[] {
    return binding.control.childErrors.filter((e) =>
      getControlPath(e).startsWith(composePaths(binding.control.path, `${index}`)),
    );
  }

  function childLabelForIndex(index: number): string {
    return binding.childLabelForIndex?.(index) ?? `Item ${index + 1}`;
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
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="my-2 text-sm">{binding.control.errors}</p>
  {/if}
  <div class="flex h-full w-full flex-col">
    <!-- Toolbar -->
    <div class="flex items-center justify-between px-4 py-2">
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-semibold">
          {binding.computedLabel}
        </h3>
        {#if binding.control.childErrors.length > 0 && !binding.appliedOptions.hideArraySummaryValidation && binding.appliedOptions.showValidationIndicator !== false}
          <ValidationIcon data-array-summary errors={binding.control.childErrors} />
        {/if}
      </div>
      <div class="flex items-center gap-2">
        <Button
          size="icon-sm"
          disabled={addDisabled}
          onclick={addButtonClick}
          aria-label={binding.control.translations?.addAriaLabel ?? 'Add item'}
          title={binding.control.translations?.addTooltip ?? 'Add item'}
        >
          <PlusOutline class="h-4 w-4" />
        </Button>
      </div>
    </div>

    {#if dataLength === 0}
      <p class="text-muted-foreground py-8 text-center">
        {binding.control.translations?.noDataMessage ?? 'No data'}
      </p>
    {:else}
      <!--
        gap-4 provides the visual separation between the constrained list and
        the detail panel. overflow-hidden on the row keeps both panels from
        overflowing their shared container.
      -->
      <div class="flex flex-1 gap-4 overflow-hidden p-4">
        <div class="flex min-w-0 flex-col">
          <!-- Constrained, scrollable item list -->
          <div
            role="listbox"
            aria-label={binding.computedLabel}
            class="border-border max-h-96 min-h-64 max-w-[350px] min-w-[350px] shrink-0 overflow-y-auto rounded-lg border p-1"
            {...binding.shadcnProps('Item.Group')}
          >
            {#each page.indices.map((index) => listboxItems[index]) as item (item.value)}
              <Item.Root
                role="option"
                tabindex={0}
                aria-selected={selectedIndex === item.index}
                variant={selectedIndex === item.index ? 'muted' : 'default'}
                class="cursor-pointer flex-nowrap"
                onclick={() => {
                  if (page.prepare()) _selectedIndex = item.index;
                }}
                onkeydown={(event: KeyboardEvent) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    if (page.prepare()) _selectedIndex = item.index;
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

                <Item.Content class="min-w-0 overflow-hidden">
                  <Item.Title class="w-full min-w-0 truncate" title={item.label}>
                    {item.label}
                  </Item.Title>
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
                      aria-label={binding.control.translations?.upAriaLabel ?? 'Move up'}
                      title={binding.control.translations?.up ?? 'Move up'}
                    >
                      <ChevronUpOutline class="h-3 w-3" />
                    </Button>

                    <Button
                      variant="outline"
                      size="icon-xs"
                      disabled={item.index >= dataLength - 1 || !binding.control.enabled}
                      onclick={(e: MouseEvent) => moveDownClick(e, item.index)}
                      aria-label={binding.control.translations?.downAriaLabel ?? 'Move down'}
                      title={binding.control.translations?.down ?? 'Move down'}
                    >
                      <ChevronDownOutline class="h-3 w-3" />
                    </Button>
                  {/if}

                  <Button
                    variant="destructive"
                    size="icon-xs"
                    disabled={binding.appliedOptions.disableRemove === true ||
                      !binding.control.enabled ||
                      (binding.appliedOptions.restrict &&
                        binding.control.arraySchema?.minItems !== undefined &&
                        dataLength <= binding.control.arraySchema.minItems)}
                    onclick={(e: MouseEvent) => removeItemsClick(e, [item.index])}
                    aria-label={binding.control.translations?.removeAriaLabel ?? 'Remove item'}
                    title={binding.control.translations?.removeTooltip ?? 'Remove item'}
                  >
                    <TrashBinOutline class="h-3 w-3" />
                  </Button>
                </div>
              </Item.Root>
            {/each}
          </div>

          <CollectionPager {page} />
        </div>
        <!-- Detail panel — scrollable, fills remaining width -->
        <div class="flex-1 overflow-y-auto">
          {#if selectedIndex === undefined}
            <div class="flex h-full items-center justify-center">
              <p class="text-muted-foreground">
                {binding.control.translations?.noSelection ?? 'Select an item to view details'}
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

{#if deletion.pending && binding.control.visible}
  <ConfirmationDialog
    operation="delete"
    onAccept={() => deletion.accept()}
    onCancel={() => deletion.cancel()}
  />
{/if}
