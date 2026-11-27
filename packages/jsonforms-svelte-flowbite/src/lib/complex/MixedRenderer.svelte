<script lang="ts">
  import Select from './components/MixedTypeSelect.svelte';
  import SplitPane from '../components/SplitPane.svelte';
  import Pane from '../components/Pane.svelte';
  import {
    useRendererMessages,
    useMixedTreeView,
    useJsonFormsControl,
    type RendererProps,
    MixedContent,
    MixedNodeLabel,
    MixedBreadcrumbContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import type { ToolbarButtonProps } from 'flowbite-svelte';
  import ContainerValidationIndicator from './components/ContainerValidationIndicator.svelte';
  import ConfirmationDialog from './components/ConfirmationDialog.svelte';
  import MixedFrame from './components/MixedFrame.svelte';
  import JsonTypeIcon from '$lib/components/JsonTypeIcon.svelte';
  import TreeView from '$lib/components/TreeView/TreeView.svelte';
  import type { FilterFunction } from '$lib/components/TreeView/types';
  import ControlWrapper from '$lib/controls/ControlWrapper.svelte';
  import type { ControlElement } from '@jsonforms/core';
  import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Input,
    Span,
    ToolbarButton,
    Tooltip,
  } from 'flowbite-svelte';
  import {
    CheckOutline as CheckIcon,
    CloseOutline as XIcon,
    EyeOutline,
    EyeSlashOutline,
    PenOutline,
    TrashBinOutline,
  } from 'flowbite-svelte-icons';
  import { twMerge } from 'tailwind-merge';
  import {
    NavigationContextSymbol,
    setIsDynamicProperty,
    useCombinatorTranslations,
    useFlowbiteControl,
  } from '../util';
  import { buildTreeFromData } from './util/treeBuilder.svelte';

  // ============================================================================
  // Props & Core Setup
  // ============================================================================

  const props: RendererProps<ControlElement> = $props();
  const binding = useCombinatorTranslations(useFlowbiteControl(useJsonFormsControl(props)));

  const view = useMixedTreeView(props, binding, buildTreeFromData, NavigationContextSymbol, false);
  const {
    nestedViewLabel,
    breadcrumbSegments,
    canClearType,
    visibleTreeNodes,
    editor,
    navigation,
    actions,
    validationAt,
    handleClearSelection,
    handleNodeClick,
  } = $derived(view);
  const { selectedIndex, selectItems, requestTypeChange } = $derived(editor);
  const { navContext, parentNavContext, treeNodePath } = $derived(navigation);
  let renameInputRef = $state<HTMLInputElement | undefined>(undefined);
  const customFilter: FilterFunction = (value, query) => {
    return typeof value === 'string' && value.toLowerCase().includes(query.toLowerCase());
  };

  function handleSelectChange(event: Event): void {
    if (!binding.control.enabled || binding.control.readonly) return;
    const target = event.target as HTMLSelectElement;
    const newIndex = target.value ? parseInt(target.value) : null;

    target.value = selectedIndex?.toString() ?? '';
    requestTypeChange(newIndex);
  }

  $effect(() => {
    if (actions.renamingNodeId && renameInputRef) {
      renameInputRef.focus();
    }
  });
  // use the default value since all properties are dynamic so preserve the property key
  setIsDynamicProperty(true);

  const searchInputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      ...flowbiteProps,
      type: 'text',
      'aria-label': message('mixed.searchLabel'),
      placeholder: message('mixed.searchPlaceholder'),
      class: twMerge('mb-4', flowbiteProps.class),
    };
  });

  const renameInputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      ...flowbiteProps,
      type: 'text',
      class: twMerge(
        'min-w-0 flex-1 text-sm',
        actions.renameError ? 'border-red-500' : 'border-primary-500',
        flowbiteProps.class,
      ),
    };
  });

  const treeActionButtonProps = (
    color: ToolbarButtonProps['color'],
    className: string,
    ariaLabel: string,
  ) => {
    const flowbiteProps = binding.flowbiteProps('ToolbarButton');
    const configuredColor = flowbiteProps.color as ToolbarButtonProps['color'];

    return {
      ...flowbiteProps,
      color: configuredColor ?? color,
      'aria-label': ariaLabel,
      class: twMerge(className, flowbiteProps.class),
    };
  };
</script>

{#snippet typeSelector(stopPropagation: boolean)}
  <Select
    id={binding.control.id + '-input-selector'}
    aria-label={message('mixed.typeLabel')}
    disabled={!binding.control.enabled}
    items={selectItems}
    value={selectedIndex?.toString() ?? ''}
    placeholder={message('mixed.typePlaceholder')}
    onclick={stopPropagation ? (event: Event) => event.stopPropagation() : undefined}
    onchange={handleSelectChange}
    clearable={canClearType}
    onClear={handleClearSelection}
    onfocus={binding.handleFocus}
    onblur={binding.handleBlur}
    required={binding.control.required}
    aria-invalid={!!binding.control.errors}
    class="w-full"
  />
{/snippet}

<MixedContent
  {ControlWrapper}
  {view}
  {binding}
  {ConfirmationDialog}
  {ContainerValidationIndicator}
  Frame={MixedFrame}
  {typeSelector}
  {SplitPane}
  {Pane}
  constrainTree
  resizeLabel={message('splitLayout.resize')}
  labelPadding="5px"
>
  {#snippet treeToolbar()}
    <Input
      bind:value={view.searchQuery}
      {...searchInputProps}
      class={twMerge(searchInputProps.class, 'mb-0 min-w-0 flex-1')}
    ></Input>
    <ToolbarButton
      {...treeActionButtonProps('default', 'shrink-0 rounded p-0.5', view.primitiveToggleLabel)}
      title={view.primitiveToggleLabel}
      onclick={() => (view.showPrimitivesInTree = !view.showPrimitivesInTree)}
    >
      {#if view.showPrimitivesInTree}
        <EyeOutline class="h-3 w-3" />
      {:else}
        <EyeSlashOutline class="h-3 w-3" />
      {/if}
    </ToolbarButton>
    <Tooltip>{view.primitiveToggleLabel}</Tooltip>
  {/snippet}
  {#snippet treeNavigation()}
    <section aria-label={message('mixed.treeLabel')}>
      {#key view.showPrimitivesInTree}
        <TreeView
          nodes={visibleTreeNodes}
          bind:expandedNodes={view.expandedNodes}
          bind:activeNodeId={view.activeNodeId}
          search={view.searchQuery}
          {customFilter}
          filterKeys={['label', 'data.description']}
          filterMode="intersection"
          onNodeClick={handleNodeClick}
          onNodeDelete={actions.handleNodeDelete}
          scrollable={true}
          maxHeight="calc(100vh - 300px)"
        >
          {#snippet nodeSnippet({ node, active })}
            <div class="group flex min-w-0 flex-1 items-center gap-1">
              <!-- Type icon -->
              {#if node.data?.type}
                <JsonTypeIcon type={node.data.type} {active} />
              {:else}
                <svg
                  class="h-4 w-4 shrink-0 {active
                    ? 'text-white dark:text-white'
                    : 'text-gray-500 dark:text-gray-400'}"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                </svg>
              {/if}

              <!-- Label or rename input -->
              <MixedNodeLabel
                {node}
                {actions}
                {validationAt}
                {ContainerValidationIndicator}
                {CheckIcon}
                {XIcon}
              >
                {#snippet field()}<Input
                    {...renameInputProps}
                    bind:elementRef={renameInputRef}
                    {...actions.renameInput(node)}
                    bind:value={actions.renameValue}
                  />{/snippet}
                {#snippet button(attributes, icon)}<Button
                    type="button"
                    color="alternative"
                    size="xs"
                    {...attributes}>{@render icon()}</Button
                  >{/snippet}
                {#snippet text(value, cls, role)}<Span class={cls} {role}>{value}</Span>{/snippet}
              </MixedNodeLabel>

              <!-- Action buttons -->
              {#if actions.renamingNodeId !== node.id && binding.control.enabled}
                <div class="ms-auto flex shrink-0 items-center gap-0.5">
                  <!-- Rename/delete - visible on hover for non-root nodes -->
                  {#if node.data?.path !== binding.control.path}
                    <div
                      class="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
                      style:opacity={active || view.focusedNodeId === node.id ? 1 : undefined}
                    >
                      {#if actions.canRenameNode(node)}
                        <ToolbarButton
                          {...treeActionButtonProps(
                            'default',
                            `rounded p-0.5 ${
                              active
                                ? 'hover:bg-primary-800 text-white'
                                : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
                            }`,
                            message('mixed.rename'),
                          )}
                          title={message('mixed.rename')}
                          {...view.nodeFocus(node.id)}
                          onclick={(e: MouseEvent) => {
                            e.stopPropagation();
                            actions.handleRename(node);
                          }}
                        >
                          <PenOutline class="h-3 w-3" />
                        </ToolbarButton>
                        <Tooltip>{message('mixed.rename')}</Tooltip>
                      {/if}
                      {#if node.data?.canDelete && !actions.isDeleteDisabled(node)}
                        <ToolbarButton
                          {...treeActionButtonProps(
                            'red',
                            `rounded p-0.5 ${
                              active
                                ? 'text-white hover:bg-red-600'
                                : 'text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900'
                            }`,
                            message('mixed.delete'),
                          )}
                          title={message('mixed.delete')}
                          {...view.nodeFocus(node.id)}
                          onclick={(e: MouseEvent) => {
                            e.stopPropagation();
                            actions.handleNodeDelete(node);
                          }}
                        >
                          <TrashBinOutline class="h-3 w-3" />
                        </ToolbarButton>
                        <Tooltip>{message('mixed.delete')}</Tooltip>
                      {/if}
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/snippet}
        </TreeView>
      {/key}
    </section>
  {/snippet}
  {#snippet breadcrumbs()}
    <Breadcrumb aria-label={message('mixed.navigationPath')} class="mb-0">
      {#each breadcrumbSegments as segment (segment.path)}
        <BreadcrumbItem
          home={false}
          onclick={() => navContext.selectPath(segment.path)}
          class="cursor-pointer"
        >
          <Span
            class="hover:text-primary-600 dark:hover:text-primary-400 text-sm"
            aria-label={segment.accessibleLabel}
          >
            <MixedBreadcrumbContent {segment} activePath={view.activeNodeId} {JsonTypeIcon} />
          </Span>
        </BreadcrumbItem>
      {/each}
    </Breadcrumb>
  {/snippet}
  {#snippet viewButton()}
    <ToolbarButton
      color="primary"
      onclick={() => parentNavContext?.viewPath(treeNodePath)}
      title={nestedViewLabel}
      aria-label={nestedViewLabel}
    >
      <EyeOutline class="h-4 w-4" />
      <Tooltip>{nestedViewLabel}</Tooltip>
    </ToolbarButton>{/snippet}
</MixedContent>
