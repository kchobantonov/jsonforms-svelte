<script lang="ts">
  import {
    CollectionItem,
    dataPathSegments,
    errorTargetSegments,
  } from '@chobantonov/jsonforms-svelte';
  import { useCollectionAction } from '@chobantonov/jsonforms-svelte';
  import { useArrayPanelState, useDeletionConfirmation } from '@chobantonov/jsonforms-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
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
  const message = useRendererMessages();

  const props: RendererProps<ControlElement> = $props();
  const binding = useShadcnArrayControl(useJsonFormsArrayControl(props));
  const panel = useArrayPanelState(
    () => binding.control.uischema.options,
    () => binding.control.config,
  );
  const panelContentId = $props.id();

  let selectedKey = $state<string | undefined>(undefined);
  const selectedIndex = $derived.by(() => {
    const index = selectedKey === undefined ? -1 : binding.control.rowKeys.indexOf(selectedKey);
    return index < 0 ? undefined : index;
  });

  $effect(() => {
    if (selectedKey !== undefined && !binding.control.rowKeys.includes(selectedKey))
      selectedKey = undefined;
  });

  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);
  const headerErrors = $derived.by(() => {
    const errors = binding.control.childErrors;
    if (!binding.appliedOptions.hideArraySummaryValidation) return errors;
    const path = dataPathSegments(binding.control.path);
    return errors.filter((error) => {
      const target = errorTargetSegments(error);
      return target.length === path.length && path.every((part, index) => target[index] === part);
    });
  });
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

  const runCollectionAction = useCollectionAction(() => binding.control, page.prepare);

  function addButtonClick() {
    void runCollectionAction(
      () => !addDisabled,
      () => {
        binding.addItem(
          binding.control.path,
          createDefaultValue(binding.control.schema, binding.control.rootSchema),
        )();
      },
    );
  }

  function move(event: Event, from: number, direction: -1 | 1) {
    event.stopPropagation();
    const to = from + direction;
    void runCollectionAction(
      () =>
        !!binding.appliedOptions.showSortButtons &&
        Number.isInteger(from) &&
        from >= 0 &&
        from < dataLength &&
        to >= 0 &&
        to < dataLength,
      () => {
        const action = direction === -1 ? binding.moveUp : binding.moveDown;
        action?.(binding.control.path, from)();
      },
    );
  }
  function moveUpClick(event: Event, index: number) {
    move(event, index, -1);
  }
  function moveDownClick(event: Event, index: number) {
    move(event, index, 1);
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
    const rowPath = composePaths(binding.control.path, `${index}`);
    return binding.control.childErrors.filter((error) => {
      const path = getControlPath(error);
      return path === rowPath || path.startsWith(rowPath + '.');
    });
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
    (binding.control.data ?? []).map((_: unknown, index: number): ListboxItem => ({
      value: binding.control.rowKeys[index],
      label: childLabelForIndex(index),
      index,
    })),
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
        {#if headerErrors.length > 0 && binding.appliedOptions.showValidationIndicator !== false}
          <ValidationIcon data-array-summary errors={headerErrors} />
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if panel.collapsible}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            data-array-panel-toggle
            aria-label={message(panel.collapsed ? 'tree.expand' : 'tree.collapse', {
              label: binding.computedLabel,
            })}
            aria-expanded={!panel.collapsed}
            aria-controls={panelContentId}
            onclick={panel.toggle}
          >
            {#if panel.collapsed}<ChevronDownOutline class="h-4 w-4" />{:else}<ChevronUpOutline
                class="h-4 w-4"
              />{/if}
          </Button>
        {/if}
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

    <div
      id={panelContentId}
      hidden={panel.collapsed}
      class="flex min-h-0 flex-1 flex-col"
      style:display={panel.collapsed ? 'none' : 'flex'}
    >
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
                    if (page.prepare()) selectedKey = item.value;
                  }}
                  onkeydown={(event: KeyboardEvent) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      if (page.prepare()) selectedKey = item.value;
                    }
                  }}
                  {...binding.shadcnProps('Item')}
                >
                  {#if binding.appliedOptions.hideAvatar}
                    <ValidationIcon data-list-item-errors errors={childErrors(item.index)} />
                  {:else}
                    <div data-list-avatar class="relative shrink-0">
                      <ValidationBadge
                        data-list-item-errors
                        border
                        errors={childErrors(item.index)}
                      >
                        <Avatar.Root size="lg" class="bg-muted">
                          <Avatar.Fallback>{item.index + 1}</Avatar.Fallback>
                        </Avatar.Root>
                      </ValidationBadge>
                    </div>
                  {/if}

                  {#if binding.appliedOptions.hideAvatar}<span class="sr-only"
                      >{message('collection.index', { index: item.index + 1 })}:</span
                    >{/if}

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
              {#key selectedKey}
                <CollectionItem
                  identity={binding.control.rowKeys[selectedIndex]}
                  path={composePaths(binding.control.path, `${selectedIndex}`)}
                  sourceItem={binding.control.data[selectedIndex]}
                >
                  <DispatchRenderer
                    schema={binding.control.schema}
                    uischema={foundUISchema}
                    path={composePaths(binding.control.path, `${selectedIndex}`)}
                    enabled={binding.control.enabled}
                    renderers={binding.control.renderers}
                    cells={binding.control.cells}
                  />
                </CollectionItem>
              {/key}
            {/if}
          </div>
        </div>
      {/if}
    </div>
  </div>
{/if}

{#if deletion.pending && binding.control.visible}
  <ConfirmationDialog operation="delete" onAccept={deletion.accept} onCancel={deletion.cancel} />
{/if}
