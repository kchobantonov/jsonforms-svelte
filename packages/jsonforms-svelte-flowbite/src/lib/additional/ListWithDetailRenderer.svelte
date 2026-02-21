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
    type ControlElement,
  } from '@jsonforms/core';
  import type { ErrorObject } from 'ajv';
  import {
    Avatar,
    Button,
    Heading,
    Listgroup,
    ListgroupItem,
    P,
    Span,
    Tooltip,
  } from 'flowbite-svelte';
  import {
    ChevronDownOutline,
    ChevronUpOutline,
    PlusOutline,
    TrashBinOutline,
  } from 'flowbite-svelte-icons';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useFlowbiteArrayControl } from '../util';

  // Props
  const props: RendererProps<ControlElement> = $props();

  const binding = useFlowbiteArrayControl(useJsonFormsArrayControl(props));

  // Local state
  let _selectedIndex = $state<number | undefined>(undefined);

  // Computed selected index with bounds checking
  let selectedIndex = $derived.by(() => {
    const len = binding.control.data?.length ?? 0;

    // If no index or out of bounds → undefined
    if (_selectedIndex === undefined || _selectedIndex >= len) {
      return undefined;
    }

    return _selectedIndex;
  });

  // Computed values
  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);

  const foundUISchema = $derived(
    findUISchema(
      binding.control.uischemas,
      binding.control.schema,
      binding.control.uischema.scope,
      binding.control.path,
      undefined,
      binding.control.uischema,
    ),
  );

  const addDisabled = $derived(
    !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema?.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  // Methods
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
      e.instancePath.startsWith(composePaths(binding.control.path, `${index}`)),
    );
  }

  function childLabelForIndex(index: number): string {
    return binding.childLabelForIndex?.(index) || `Item ${index + 1}`;
  }

  function selectItem(index: number) {
    _selectedIndex = index;
  }
</script>

{#if binding.control.visible}
  <div class="flex h-full w-full flex-col">
    <div class="flex items-center justify-between border-gray-200 p-4 dark:border-gray-700">
      <Heading tag="h3" class="text-lg font-semibold">
        {binding.computedLabel}
      </Heading>

      <div class="flex items-center gap-2">
        {#if binding.control.childErrors.length > 0}
          <ValidationIcon errors={binding.control.childErrors} />
        {/if}

        <Button
          color="primary"
          size="sm"
          disabled={addDisabled}
          onclick={addButtonClick}
          aria-label={binding.control.translations?.addAriaLabel || 'Add item'}
        >
          <PlusOutline class="h-4 w-4" />
        </Button>
        <Tooltip>
          <Span>{binding.control.translations?.addTooltip || 'Add item'}</Span>
        </Tooltip>
      </div>
    </div>

    {#if dataLength === 0}
      <P class="text-center">
        {binding.control.translations?.noDataMessage || 'No data'}
      </P>
    {:else}
      <div class="flex flex-1 overflow-hidden">
        <Listgroup
          active
          class="max-h-96 min-h-64 max-w-[350px] min-w-[350px] shrink-0 overflow-y-auto"
        >
          {#each binding.control.data as item, index (composePaths(binding.control.path, `${index}`))}
            <ListgroupItem
              active
              current={selectedIndex === index}
              onclick={() => selectItem(index)}
            >
              <div class="relative shrink-0">
                <ValidationBadge errors={childErrors(index)}>
                  <Avatar
                    size="md"
                    color={selectedIndex === index ? 'primary' : 'alternative'}
                    class="flex items-center justify-center"
                  >
                    {index + 1}
                  </Avatar>
                </ValidationBadge>
              </div>

              <div class="min-w-0 flex-1 text-start">
                <P class="truncate text-sm font-medium">
                  {childLabelForIndex(index)}
                </P>
                <Tooltip>
                  <Span>{childLabelForIndex(index)}</Span>
                </Tooltip>
              </div>

              <div class="flex shrink-0 items-center gap-1">
                {#if binding.appliedOptions.showSortButtons}
                  <Button
                    color="alternative"
                    size="xs"
                    disabled={index <= 0 || !binding.control.enabled}
                    onclick={(e: MouseEvent) => moveUpClick(e, index)}
                    aria-label={binding.control.translations?.upAriaLabel || 'Move up'}
                  >
                    <ChevronUpOutline class="h-3 w-3" />
                  </Button>
                  <Tooltip>
                    <Span>{binding.control.translations?.up || 'Move up'}</Span>
                  </Tooltip>

                  <Button
                    color="alternative"
                    size="xs"
                    disabled={index >= dataLength - 1 || !binding.control.enabled}
                    onclick={(e: MouseEvent) => moveDownClick(e, index)}
                    aria-label={binding.control.translations?.downAriaLabel || 'Move down'}
                  >
                    <ChevronDownOutline class="h-3 w-3" />
                  </Button>
                  <Tooltip>
                    <Span>{binding.control.translations?.down || 'Move down'}</Span>
                  </Tooltip>
                {/if}

                <Button
                  color="red"
                  size="xs"
                  disabled={!binding.control.enabled ||
                    (binding.appliedOptions.restrict &&
                      binding.control.arraySchema?.minItems !== undefined &&
                      dataLength <= binding.control.arraySchema.minItems)}
                  onclick={(e: MouseEvent) => removeItemsClick(e, [index])}
                  aria-label={binding.control.translations?.removeAriaLabel || 'Remove item'}
                >
                  <TrashBinOutline class="h-3 w-3" />
                </Button>
                <Tooltip>
                  <Span>{binding.control.translations?.removeTooltip || 'Remove item'}</Span>
                </Tooltip>
              </div>
            </ListgroupItem>
          {/each}
        </Listgroup>

        <div class="flex-1 overflow-y-auto p-4">
          {#if selectedIndex === undefined}
            <div class="flex h-full items-center justify-center">
              <P class="text-xl">
                {binding.control.translations?.noSelection || 'No selection'}
              </P>
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
