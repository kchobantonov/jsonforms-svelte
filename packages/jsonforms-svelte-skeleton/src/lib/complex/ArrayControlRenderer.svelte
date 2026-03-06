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
  import { twMerge } from 'tailwind-merge';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useSkeletonArrayControl } from '../util';

  const props: RendererProps<ControlElement> = $props();
  const binding = useSkeletonArrayControl(useJsonFormsArrayControl(props));

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

  function isDeleteDisabled(index: number): boolean {
    return (
      !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema !== undefined &&
        binding.control.arraySchema.minItems !== undefined &&
        dataLength <= binding.control.arraySchema.minItems)
    );
  }

  const cardProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('card');
    return {
      ...skeletonProps,
      class: twMerge(
        'card preset-outlined-surface-200-800 mt-1 mb-1 min-w-full',
        binding.styles.arrayList.root,
        skeletonProps.class,
      ),
    };
  });
</script>

{#if binding.control.visible}
  <section {...cardProps}>
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

      <button
        type="button"
        class={twMerge('btn btn-sm preset-filled', binding.styles.arrayList?.addButton)}
        disabled={addDisabled}
        onclick={addButtonClick}
        aria-label={binding.control.translations?.addAriaLabel || 'Add item'}
        title={binding.control.translations?.addTooltip || 'Add item'}
      >
        <PlusOutline class="h-4 w-4" />
      </button>
    </div>

    <!-- Table -->
    <div class="px-4 pb-4">
      <div class="w-full overflow-x-auto">
        <table class="table w-full">
          {#if binding.control.schema.type === 'object'}
            <thead>
              <tr>
                {#each validColumnProps as prop (prop)}
                  <th>
                    {title(prop)}
                    {#if showAsterisk(prop)}
                      <span
                        aria-hidden="true"
                        class={twMerge(
                          'text-error-500 dark:text-error-400 ms-0.5',
                          binding.styles?.control?.asterisk,
                        )}>*</span
                      >
                    {/if}
                  </th>
                {/each}
                {#if binding.control.enabled}
                  <th class={twMerge('text-center', actionColClass)}></th>
                {/if}
              </tr>
            </thead>
          {/if}

          <tbody>
            {#each binding.control.data as element, index (index)}
              <tr class={binding.styles.arrayList?.item}>
                {#each validColumnProps as propName (propName)}
                  <td class="px-4 py-2">
                    <DispatchRenderer
                      schema={binding.control.schema}
                      uischema={resolveUiSchema(propName)}
                      path={composePaths(binding.control.path, `${index}`)}
                      enabled={binding.control.enabled}
                      renderers={binding.control.renderers}
                      cells={binding.control.cells}
                    />
                  </td>
                {/each}

                {#if binding.control.enabled}
                  <td class={twMerge('px-4 py-2 text-center', actionColClass)}>
                    <div class="flex items-center justify-center gap-1">
                      {#if binding.appliedOptions.showSortButtons}
                        <button
                          type="button"
                          class={twMerge(
                            'btn btn-sm preset-outlined',
                            binding.styles.arrayList?.itemMoveUp,
                          )}
                          disabled={index <= 0 || !binding.control.enabled}
                          onclick={(e: MouseEvent) => moveUpClick(e, index)}
                          aria-label={binding.control.translations?.upAriaLabel || 'Move up'}
                          title={binding.control.translations?.up || 'Move up'}
                        >
                          <ChevronUpOutline class="h-3 w-3" />
                        </button>

                        <button
                          type="button"
                          class={twMerge(
                            'btn btn-sm preset-outlined',
                            binding.styles.arrayList?.itemMoveDown,
                          )}
                          disabled={index >= dataLength - 1 || !binding.control.enabled}
                          onclick={(e: MouseEvent) => moveDownClick(e, index)}
                          aria-label={binding.control.translations?.downAriaLabel || 'Move down'}
                          title={binding.control.translations?.down || 'Move down'}
                        >
                          <ChevronDownOutline class="h-3 w-3" />
                        </button>
                      {/if}

                      <button
                        type="button"
                        class={twMerge(
                          'btn btn-sm preset-tonal hover:preset-filled-error-500',
                          binding.styles.arrayList?.itemDelete,
                        )}
                        disabled={isDeleteDisabled(index)}
                        onclick={(e: MouseEvent) => removeItemsClick(e, [index])}
                        aria-label={binding.control.translations?.removeAriaLabel || 'Delete item'}
                        title={binding.control.translations?.removeTooltip || 'Delete'}
                      >
                        <TrashBinOutline class="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                {/if}
              </tr>
            {/each}

            {#if dataLength === 0}
              <tr>
                <td
                  class="px-4 py-2 text-center"
                  colspan={validColumnProps.length + (binding.control.enabled ? 1 : 0)}
                >
                  <p class={twMerge('text-center', binding.styles.arrayList?.noData)}>
                    {binding.control.translations?.noDataMessage || 'No data'}
                  </p>
                </td>
              </tr>
            {/if}
          </tbody>
        </table>
      </div>
    </div>
  </section>
{/if}
