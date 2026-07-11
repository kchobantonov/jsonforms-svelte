<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsArrayControl,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import { composePaths, createDefaultValue, type ControlElement } from '@jsonforms/core';
  import {
    ChevronDownIcon as ChevronDownOutline,
    ChevronUpIcon as ChevronUpOutline,
    PlusIcon as PlusOutline,
    Trash2Icon as TrashBinOutline,
  } from '@lucide/svelte';
  import startCase from 'lodash/startCase';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import * as Table from '$lib/components/ui/table';
  import { twMerge } from 'tailwind-merge';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useShadcnArrayControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const binding = useShadcnArrayControl(useJsonFormsArrayControl(props));

  const dataLength = $derived(binding.control.data ? binding.control.data.length : 0);

  const validColumnProps = $derived.by(() => {
    if (
      binding.control.schema.type === 'object' &&
      typeof binding.control.schema.properties === 'object'
    ) {
      return Object.keys(binding.control.schema.properties).filter(
        (prop) => binding.control.schema.properties![prop].type !== 'array',
      );
    }
    return [''];
  });

  const addDisabled = $derived(
    !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema !== undefined &&
        binding.control.arraySchema.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  // Action column width depends on whether sort buttons are shown
  const actionColClass = $derived(
    binding.appliedOptions.showSortButtons ? 'w-[150px]' : 'w-[50px]',
  );

  function title(prop: string): string {
    return binding.control.schema.properties?.[prop]?.title ?? startCase(prop);
  }

  function showAsterisk(prop: string): boolean {
    return binding.control.schema.required?.includes(prop) ?? false;
  }

  function resolveUiSchema(propName: string): ControlElement {
    const scope = binding.control.schema.properties && propName ? `#/properties/${propName}` : '#';
    return { type: 'Control', scope, label: false };
  }

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

  function isDeleteDisabled(): boolean {
    return (
      !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema !== undefined &&
        binding.control.arraySchema.minItems !== undefined &&
        dataLength <= binding.control.arraySchema.minItems)
    );
  }

  const cardProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('card');
    return {
      ...shadcnProps,
      class: twMerge('my-1 min-w-full', binding.styles.arrayList.root, shadcnProps.class),
    };
  });
</script>

{#if binding.control.visible}
  <Card.Root {...cardProps}>
    <!-- Toolbar -->
    <div
      class={twMerge(
        'flex items-center justify-between px-4 py-2',
        binding.styles.arrayList.toolbar,
      )}
    >
      <div class={twMerge('flex items-center gap-2', binding.styles.arrayList.title)}>
        <h3 class={twMerge('text-lg font-semibold', binding.styles.arrayList.label)}>
          {binding.computedLabel}
        </h3>
        {#if binding.control.childErrors.length > 0 && !binding.appliedOptions.hideArraySummaryValidation}
          <ValidationIcon
            errors={binding.control.childErrors}
            class={binding.styles.arrayList.validationIcon}
          />
        {/if}
      </div>

      <Button
        size="icon-sm"
        class={binding.styles.arrayList?.addButton}
        disabled={addDisabled}
        onclick={addButtonClick}
        aria-label={binding.control.translations?.addAriaLabel || 'Add item'}
        title={binding.control.translations?.addTooltip || 'Add item'}
      >
        <PlusOutline class="h-4 w-4" />
      </Button>
    </div>

    <!-- Table -->
    <div class="px-4 pb-4">
      <Table.Root>
        {#if binding.control.schema.type === 'object'}
          <Table.Header>
            <Table.Row>
              {#each validColumnProps as prop (prop)}
                <Table.Head>
                  {title(prop)}
                  {#if showAsterisk(prop)}
                    <span
                      aria-hidden="true"
                      class={twMerge('text-destructive ms-0.5', binding.styles?.control?.asterisk)}
                      >*</span
                    >
                  {/if}
                </Table.Head>
              {/each}
              {#if binding.control.enabled}
                <Table.Head class={twMerge('text-center', actionColClass)}></Table.Head>
              {/if}
            </Table.Row>
          </Table.Header>
        {/if}

        <Table.Body>
          {#each binding.control.data as _element, index (index)}
            <Table.Row class={binding.styles.arrayList?.item}>
              {#each validColumnProps as propName (propName)}
                <Table.Cell class="px-4 py-2">
                  <DispatchRenderer
                    schema={binding.control.schema}
                    uischema={resolveUiSchema(propName)}
                    path={composePaths(binding.control.path, `${index}`)}
                    enabled={binding.control.enabled}
                    renderers={binding.control.renderers}
                    cells={binding.control.cells}
                  />
                </Table.Cell>
              {/each}

              {#if binding.control.enabled}
                <Table.Cell class={twMerge('px-4 py-2 text-center', actionColClass)}>
                  <div class="flex items-center justify-center gap-1">
                    {#if binding.appliedOptions.showSortButtons}
                      <Button
                        variant="outline"
                        size="icon-xs"
                        class={twMerge(binding.styles.arrayList?.itemMoveUp)}
                        disabled={index <= 0 || !binding.control.enabled}
                        onclick={(e: MouseEvent) => moveUpClick(e, index)}
                        aria-label={binding.control.translations?.upAriaLabel || 'Move up'}
                        title={binding.control.translations?.up || 'Move up'}
                      >
                        <ChevronUpOutline class="h-3 w-3" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon-xs"
                        class={twMerge(binding.styles.arrayList?.itemMoveDown)}
                        disabled={index >= dataLength - 1 || !binding.control.enabled}
                        onclick={(e: MouseEvent) => moveDownClick(e, index)}
                        aria-label={binding.control.translations?.downAriaLabel || 'Move down'}
                        title={binding.control.translations?.down || 'Move down'}
                      >
                        <ChevronDownOutline class="h-3 w-3" />
                      </Button>
                    {/if}

                    <Button
                      variant="destructive"
                      size="icon-xs"
                      class={twMerge(binding.styles.arrayList?.itemDelete)}
                      disabled={isDeleteDisabled()}
                      onclick={(e: MouseEvent) => removeItemsClick(e, [index])}
                      aria-label={binding.control.translations?.removeAriaLabel || 'Delete item'}
                      title={binding.control.translations?.removeTooltip || 'Delete'}
                    >
                      <TrashBinOutline class="h-3 w-3" />
                    </Button>
                  </div>
                </Table.Cell>
              {/if}
            </Table.Row>
          {/each}

          {#if dataLength === 0}
            <Table.Row>
              <Table.Cell
                class="px-4 py-2 text-center"
                colspan={validColumnProps.length + (binding.control.enabled ? 1 : 0)}
              >
                <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
                  {binding.control.translations?.noDataMessage || 'No data'}
                </p>
              </Table.Cell>
            </Table.Row>
          {/if}
        </Table.Body>
      </Table.Root>
    </div>
  </Card.Root>
{/if}
