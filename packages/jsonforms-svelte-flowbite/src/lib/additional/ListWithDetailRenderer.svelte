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
  import { twMerge } from 'tailwind-merge';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import ValidationIcon from '../controls/components/ValidationIcon.svelte';
  import { useFlowbiteArrayControl } from '../util';

  // Props
  import CollectionPager from '../components/CollectionPager.svelte';
  const jsonforms = useJsonForms();
  const message = useRendererMessages();

  const props: RendererProps<ControlElement> = $props();

  const binding = useFlowbiteArrayControl(useJsonFormsArrayControl(props));
  const panel = useArrayPanelState(
    () => binding.control.uischema.options,
    () => binding.control.config,
  );
  const panelContentId = $props.id();

  // Local state
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
    ),
  );

  const addDisabled = $derived(
    binding.appliedOptions.disableAdd === true ||
      !binding.control.enabled ||
      (binding.appliedOptions.restrict &&
        binding.control.arraySchema?.maxItems !== undefined &&
        dataLength >= binding.control.arraySchema.maxItems),
  );

  // Methods
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

  function selectItem(index: number) {
    if (!page.prepare()) return;
    selectedKey = binding.control.rowKeys[index];
  }

  const listgroupProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Listgroup');

    return {
      ...flowbiteProps,
      class: twMerge(
        'max-h-96 min-h-64 max-w-[350px] min-w-[350px] shrink-0 overflow-y-auto',
        flowbiteProps.class,
      ),
    };
  });
  const listgroupItemProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('ListgroupItem');
    return {
      ...flowbiteProps,
      class: twMerge('min-w-0 overflow-hidden', flowbiteProps.class),
    };
  });
  const avatarProps = $derived(binding.flowbiteProps('Avatar'));
</script>

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class="my-2 text-sm">{binding.control.errors}</p>
  {/if}
  <div class="flex h-full w-full flex-col">
    <div class="flex items-center justify-between border-gray-200 p-4 dark:border-gray-700">
      <div class="flex items-center gap-2">
        <Heading tag="h3" class="text-lg font-semibold">
          {binding.computedLabel}
        </Heading>
        {#if headerErrors.length > 0 && binding.appliedOptions.showValidationIndicator !== false}
          <ValidationIcon data-array-summary errors={headerErrors} />
        {/if}
      </div>

      <div class="flex items-center gap-2">
        {#if panel.collapsible}
          <Button
            type="button"
            color="alternative"
            size="sm"
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
          color="primary"
          size="sm"
          disabled={addDisabled}
          onclick={addButtonClick}
          aria-label={binding.control.translations?.addAriaLabel ?? 'Add item'}
        >
          <PlusOutline class="h-4 w-4" />
        </Button>
        <Tooltip>
          <Span>{binding.control.translations?.addTooltip ?? 'Add item'}</Span>
        </Tooltip>
      </div>
    </div>

    <div
      id={panelContentId}
      hidden={panel.collapsed}
      class="flex min-h-0 flex-1 flex-col"
      style:display={panel.collapsed ? 'none' : 'flex'}
    >
      {#if dataLength === 0}
        <P class="text-center">
          {binding.control.translations?.noDataMessage ?? 'No data'}
        </P>
      {:else}
        <div class="flex flex-1 overflow-hidden">
          <div class="flex min-w-0 flex-col">
            <Listgroup active {...listgroupProps}>
              {#each page.indices as index (binding.control.rowKeys[index])}
                <ListgroupItem
                  {...listgroupItemProps}
                  active
                  current={selectedIndex === index}
                  onclick={() => selectItem(index)}
                >
                  {#if binding.appliedOptions.hideAvatar}
                    <ValidationIcon data-list-item-errors errors={childErrors(index)} />
                  {:else}
                    <div data-list-avatar class="relative shrink-0">
                      <ValidationBadge data-list-item-errors border errors={childErrors(index)}>
                        <Avatar
                          {...avatarProps}
                          size="md"
                          color={selectedIndex === index ? 'primary' : 'alternative'}
                          class="flex items-center justify-center"
                          aria-label={message('collection.index', { index: index + 1 })}
                        >
                          {index + 1}
                        </Avatar>
                      </ValidationBadge>
                    </div>
                  {/if}

                  {#if binding.appliedOptions.hideAvatar}<span class="sr-only"
                      >{message('collection.index', { index: index + 1 })}:</span
                    >{/if}

                  <div class="min-w-0 flex-1 text-start">
                    <Span
                      class="block w-full truncate text-sm font-medium"
                      title={childLabelForIndex(index)}
                    >
                      {childLabelForIndex(index)}
                    </Span>
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
                        aria-label={binding.control.translations?.upAriaLabel ?? 'Move up'}
                      >
                        <ChevronUpOutline class="h-3 w-3" />
                      </Button>
                      <Tooltip>
                        <Span>{binding.control.translations?.up ?? 'Move up'}</Span>
                      </Tooltip>

                      <Button
                        color="alternative"
                        size="xs"
                        disabled={index >= dataLength - 1 || !binding.control.enabled}
                        onclick={(e: MouseEvent) => moveDownClick(e, index)}
                        aria-label={binding.control.translations?.downAriaLabel ?? 'Move down'}
                      >
                        <ChevronDownOutline class="h-3 w-3" />
                      </Button>
                      <Tooltip>
                        <Span>{binding.control.translations?.down ?? 'Move down'}</Span>
                      </Tooltip>
                    {/if}

                    <Button
                      color="red"
                      size="xs"
                      disabled={binding.appliedOptions.disableRemove === true ||
                        !binding.control.enabled ||
                        (binding.appliedOptions.restrict &&
                          binding.control.arraySchema?.minItems !== undefined &&
                          dataLength <= binding.control.arraySchema.minItems)}
                      onclick={(e: MouseEvent) => removeItemsClick(e, [index])}
                      aria-label={binding.control.translations?.removeAriaLabel ?? 'Remove item'}
                    >
                      <TrashBinOutline class="h-3 w-3" />
                    </Button>
                    <Tooltip>
                      <Span>{binding.control.translations?.removeTooltip ?? 'Remove item'}</Span>
                    </Tooltip>
                  </div>
                </ListgroupItem>
              {/each}
            </Listgroup>
            <CollectionPager {page} />
          </div>

          <div class="flex-1 overflow-y-auto p-4">
            {#if selectedIndex === undefined}
              <div class="flex h-full items-center justify-center">
                <P class="text-xl">
                  {binding.control.translations?.noSelection ?? 'No selection'}
                </P>
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
