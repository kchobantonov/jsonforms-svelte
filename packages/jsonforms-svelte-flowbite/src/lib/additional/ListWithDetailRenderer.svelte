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

  const input = useFlowbiteArrayControl(useJsonFormsArrayControl(props));

  // Local state
  let _selectedIndex = $state<number | undefined>(undefined);

  // Computed selected index with bounds checking
  let selectedIndex = $derived.by(() => {
    const len = input.control.data?.length ?? 0;

    // If no index or out of bounds → undefined
    if (_selectedIndex === undefined || _selectedIndex >= len) {
      return undefined;
    }

    return _selectedIndex;
  });

  // Computed values
  const dataLength = $derived(input.control.data ? input.control.data.length : 0);

  const foundUISchema = $derived(
    findUISchema(
      input.control.uischemas,
      input.control.schema,
      input.control.uischema.scope,
      input.control.path,
      undefined,
      input.control.uischema,
    ),
  );

  const addDisabled = $derived(
    !input.control.enabled ||
      (input.appliedOptions.restrict &&
        input.control.arraySchema?.maxItems !== undefined &&
        dataLength >= input.control.arraySchema.maxItems),
  );

  // Methods
  function addButtonClick() {
    input.addItem(
      input.control.path,
      createDefaultValue(input.control.schema, input.control.rootSchema),
    )();
  }

  function moveUpClick(event: Event, toMove: number) {
    event.stopPropagation();
    input.moveUp?.(input.control.path, toMove)();
  }

  function moveDownClick(event: Event, toMove: number) {
    event.stopPropagation();
    input.moveDown?.(input.control.path, toMove)();
  }

  function removeItemsClick(event: Event, toDelete: number[]) {
    event.stopPropagation();
    input.removeItems?.(input.control.path, toDelete)();
  }

  function childErrors(index: number): ErrorObject[] {
    return input.control.childErrors.filter((e) =>
      e.instancePath.startsWith(composePaths(input.control.path, `${index}`)),
    );
  }

  function childLabelForIndex(index: number): string {
    return input.childLabelForIndex?.(index) || `Item ${index + 1}`;
  }

  function selectItem(index: number) {
    _selectedIndex = index;
  }
</script>

{#if input.control.visible}
  <div class="flex h-full w-full flex-col">
    <div class="flex items-center justify-between border-gray-200 p-4 dark:border-gray-700">
      <Heading tag="h3" class="text-lg font-semibold">
        {input.computedLabel}
      </Heading>

      <div class="flex items-center gap-2">
        {#if input.control.childErrors.length > 0}
          <ValidationIcon errors={input.control.childErrors} />
        {/if}

        <Button
          color="primary"
          size="sm"
          disabled={addDisabled}
          onclick={addButtonClick}
          aria-label={input.control.translations?.addAriaLabel || 'Add item'}
        >
          <PlusOutline class="h-4 w-4" />
        </Button>
        <Tooltip>
          <Span>{input.control.translations?.addTooltip || 'Add item'}</Span>
        </Tooltip>
      </div>
    </div>

    {#if dataLength === 0}
      <P class="text-center">
        {input.control.translations?.noDataMessage || 'No data'}
      </P>
    {:else}
      <div class="flex flex-1 overflow-hidden">
        <Listgroup
          active
          class="max-h-96 min-h-64 max-w-[350px] min-w-[350px] shrink-0 overflow-y-auto"
        >
          {#each input.control.data as item, index (composePaths(input.control.path, `${index}`))}
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
                {#if input.appliedOptions.showSortButtons}
                  <Button
                    color="alternative"
                    size="xs"
                    disabled={index <= 0 || !input.control.enabled}
                    onclick={(e: MouseEvent) => moveUpClick(e, index)}
                    aria-label={input.control.translations?.upAriaLabel || 'Move up'}
                  >
                    <ChevronUpOutline class="h-3 w-3" />
                  </Button>
                  <Tooltip>
                    <Span>{input.control.translations?.up || 'Move up'}</Span>
                  </Tooltip>

                  <Button
                    color="alternative"
                    size="xs"
                    disabled={index >= dataLength - 1 || !input.control.enabled}
                    onclick={(e: MouseEvent) => moveDownClick(e, index)}
                    aria-label={input.control.translations?.downAriaLabel || 'Move down'}
                  >
                    <ChevronDownOutline class="h-3 w-3" />
                  </Button>
                  <Tooltip>
                    <Span>{input.control.translations?.down || 'Move down'}</Span>
                  </Tooltip>
                {/if}

                <Button
                  color="red"
                  size="xs"
                  disabled={!input.control.enabled ||
                    (input.appliedOptions.restrict &&
                      input.control.arraySchema?.minItems !== undefined &&
                      dataLength <= input.control.arraySchema.minItems)}
                  onclick={(e: MouseEvent) => removeItemsClick(e, [index])}
                  aria-label={input.control.translations?.removeAriaLabel || 'Remove item'}
                >
                  <TrashBinOutline class="h-3 w-3" />
                </Button>
                <Tooltip>
                  <Span>{input.control.translations?.removeTooltip || 'Remove item'}</Span>
                </Tooltip>
              </div>
            </ListgroupItem>
          {/each}
        </Listgroup>

        {#key selectedIndex}
          <div class="flex-1 overflow-y-auto p-4">
            {#if selectedIndex === undefined}
              <div class="flex h-full items-center justify-center">
                <P class="text-xl">
                  {input.control.translations?.noSelection || 'No selection'}
                </P>
              </div>
            {:else}
              <DispatchRenderer
                schema={input.control.schema}
                uischema={foundUISchema}
                path={composePaths(input.control.path, `${selectedIndex}`)}
                enabled={input.control.enabled}
                renderers={input.control.renderers}
                cells={input.control.cells}
              />
            {/if}
          </div>
        {/key}
      </div>
    {/if}
  </div>
{/if}
