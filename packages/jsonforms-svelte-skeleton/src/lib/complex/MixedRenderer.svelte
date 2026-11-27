<script lang="ts">
  import { MixedTreeSearch } from '@chobantonov/jsonforms-svelte-renderer-common';
  import TypeChoicePopup from './components/TypeChoicePopup.svelte';
  import TooltipContent from '../components/TooltipContent.svelte';
  import {
    useRendererMessages,
    useMixedTreeView,
    findMixedNodeByPath,
    useJsonFormsControl,
    type RendererProps,
    MixedContent,
    MixedTreeRow,
    MixedBreadcrumbContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import ContainerValidationIndicator from './components/ContainerValidationIndicator.svelte';
  import ConfirmationDialog from './components/ConfirmationDialog.svelte';
  import MixedFrame from './components/MixedFrame.svelte';
  import JsonTypeIcon from '$lib/components/JsonTypeIcon.svelte';
  import Pane from '$lib/components/Pane.svelte';
  import SplitPane from '$lib/components/SplitPane.svelte';
  import ControlWrapper from '$lib/controls/ControlWrapper.svelte';
  import type { ControlElement } from '@jsonforms/core';
  import {
    CheckIcon,
    ChevronRightIcon,
    EyeIcon as EyeOutline,
    EyeOffIcon as EyeSlashOutline,
    PencilIcon as PenOutline,
    Trash2Icon as TrashBinOutline,
    XIcon,
  } from '@lucide/svelte';
  import {
    Combobox,
    Tooltip,
    TreeView,
    createTreeViewCollection,
    useListCollection,
  } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    getPortalRootNodeGetter,
    getPortalTargetResolver,
    NavigationContextSymbol,
    setIsDynamicProperty,
    useCombinatorTranslations,
    useSkeletonControl,
  } from '../util';
  import { buildTreeFromData, type TreeNode, type TreeNodeData } from './util/treeBuilder.svelte';

  // ============================================================================
  // Props & Core Setup
  // ============================================================================

  const props: RendererProps<ControlElement> = $props();
  const binding = useCombinatorTranslations(useSkeletonControl(useJsonFormsControl(props)));
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  let primitiveHintFocused = $state(false);
  let primitiveHintHovered = $state(false);
  let primitiveHintDismissed = $state(false);
  let nestedViewHintFocused = $state(false);
  let nestedViewHintHovered = $state(false);
  let nestedViewHintDismissed = $state(false);
  let nestedViewHoverTimer: ReturnType<typeof setTimeout> | undefined;
  const nestedViewHintOpen = $derived(
    (nestedViewHintFocused || nestedViewHintHovered) && !nestedViewHintDismissed,
  );
  const dismissNestedViewHint = (event: KeyboardEvent) => {
    if (event.key === 'Escape') nestedViewHintDismissed = true;
  };
  onMount(() => () => {
    clearTimeout(nestedViewHoverTimer);
    window.removeEventListener('keydown', dismissNestedViewHint, true);
  });
  let treeHintFocused = $state<string>();
  let treeHintHovered = $state<string>();
  let treeHintDismissed = $state<string>();
  const dismissTreeHint = (event: KeyboardEvent) => {
    if (event.key === 'Escape') treeHintDismissed = treeHintFocused;
  };
  const primitiveHintOpen = $derived(
    (primitiveHintFocused || primitiveHintHovered) && !primitiveHintDismissed,
  );
  const dismissPrimitiveHint = (event: KeyboardEvent) => {
    if (event.key === 'Escape') primitiveHintDismissed = true;
  };
  onMount(() => () => window.removeEventListener('keydown', dismissPrimitiveHint, true));
  onMount(() => () => window.removeEventListener('keydown', dismissTreeHint, true));
  let typeSelectorAnchor = $state<HTMLDivElement>();
  // A type popup in a detail dialog must share its modal layer to receive pointer events.
  const typeSelectorPortalTarget = $derived(
    (typeSelectorAnchor?.closest('[data-composite-detail-dialog]') as HTMLElement | null) ??
      resolvePortalTarget() ??
      undefined,
  );

  const view = useMixedTreeView(props, binding, buildTreeFromData, NavigationContextSymbol, true);
  const {
    nestedViewLabel,
    breadcrumbSegments,
    canClearType,
    treeExpandedValue,
    filteredTreeNodes,
    editor,
    navigation,
    actions,
    handleNodeClick,
  } = $derived(view);
  const { selectedIndex, treeNodes, selectItems, requestTypeChange } = $derived(editor);
  const { navContext, parentNavContext, treeNodePath, hideRepeatedLabel } = $derived(navigation);
  const collection = $derived(
    useListCollection({
      items: selectItems,
      itemToString: (item) => item.name,
      itemToValue: (item) => item.value,
    }),
  );

  function handleSelectValueChange(details: { value: string[] }): void {
    if (!binding.control.enabled || binding.control.readonly) return;
    const selectedValue = details.value.length > 0 ? details.value[details.value.length - 1] : null;
    const newIndex = selectedValue ? parseInt(selectedValue, 10) : null;

    requestTypeChange(newIndex);
  }

  // use the default value since all properties are dynamic so preserve the property key
  setIsDynamicProperty(true);

  const searchInputProps = $derived(view.searchAttributes(binding.skeletonProps('input')));

  const renameInputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      type: 'text',
      class: twMerge(
        'input min-w-0 flex-1 text-sm',
        actions.renameError ? 'border-red-500' : 'border-primary-500',
        skeletonProps.class,
      ),
    };
  });

  const treeActionButtonProps = (className: string, ariaLabel: string) => {
    const skeletonProps = binding.skeletonProps('button');

    return {
      ...skeletonProps,
      'aria-label': ariaLabel,
      class: twMerge('btn btn-sm p-1', className, skeletonProps.class),
    };
  };

  const treeCollection = $derived(
    createTreeViewCollection<TreeNode<TreeNodeData>>({
      nodeToValue: (node) => node.id,
      nodeToString: (node) => node.label,
      nodeToChildren: (node) => node.children ?? [],
      rootNode: {
        id: '__root__',
        label: binding.control.label,
        children: filteredTreeNodes,
      },
    }),
  );

  let typeSelectorOpen = $state(false);
  function focusTypeSelectorTrigger() {
    const root = getRootNode();
    if ('querySelector' in root) {
      root
        .querySelector<HTMLButtonElement>(
          `#${CSS.escape(`${binding.control.id}-type-selector-trigger`)}`,
        )
        ?.focus();
    }
  }

  const typeSelectorComboboxProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Combobox');

    return {
      ...skeletonProps,
      collection,
      value:
        selectedIndex === null || selectedIndex === undefined ? [] : [selectedIndex.toString()],
      allowCustomValue: false,
      openOnClick: true,
      open: typeSelectorOpen,
      positioning: { fitViewport: true },
      closeOnSelect: true,
      selectionBehavior: 'replace' as const,
      getRootNode,
      disabled: !binding.control.enabled,
      invalid: !!binding.control.errors,
      required: binding.control.required,
      placeholder: message('mixed.typePlaceholder'),
      onOpenChange: (details: { open: boolean }) => {
        if (typeof skeletonProps.onOpenChange === 'function') skeletonProps.onOpenChange(details);
        typeSelectorOpen = details.open;
      },
      onValueChange: handleSelectValueChange,
    };
  });

  const typeSelectorInputProps = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('Combobox.Input');

    return {
      ...skeletonProps,
      id: `${binding.control.id}-input-selector`,
      'aria-label': message('mixed.typeLabel'),
      class: twMerge(binding.styles.control.input, skeletonProps.class, 'w-full pe-20'),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
    };
  });
</script>

<svelte:window
  onkeydowncapture={(event) => {
    if (event.key !== 'Escape' || !typeSelectorOpen) return;
    event.preventDefault();
    event.stopPropagation();
    typeSelectorOpen = false;
    focusTypeSelectorTrigger();
  }}
/>

{#snippet typeSelector(stopPropagation: boolean)}
  <div class="contents" bind:this={typeSelectorAnchor}>
    <Combobox
      translations={{
        triggerLabel: message('control.selectOption'),
        clearTriggerLabel: message('control.clearValue'),
      }}
      {...typeSelectorComboboxProps}
    >
      <Combobox.Control
        class="group relative w-full"
        onclick={stopPropagation ? (e: Event) => e.stopPropagation() : undefined}
        onmousedown={stopPropagation ? (e: MouseEvent) => e.stopPropagation() : undefined}
      >
        <Combobox.Input {...typeSelectorInputProps} />
        {#if canClearType && selectedIndex !== null && selectedIndex !== undefined}
          <Combobox.ClearTrigger
            class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
            style="position: absolute; inset-block: 0; inset-inline-end: 2.25rem; margin-block: auto;"
            {...view.clearTypeButton(stopPropagation)}
          >
            <XIcon class="size-4 shrink-0" />
          </Combobox.ClearTrigger>
        {/if}
        <Combobox.Trigger id={`${binding.control.id}-type-selector-trigger`} />
      </Combobox.Control>

      <TypeChoicePopup target={typeSelectorPortalTarget} items={selectItems} />
    </Combobox>
  </div>
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
  labelPadding="1rem"
  rowClass={'flex w-full min-w-0 flex-row items-start gap-2' + (hideRepeatedLabel ? ' pt-3' : '')}
  selectorClass="w-40 shrink-0"
  valueClass="min-w-0 flex-1"
>
  {#snippet treeToolbar()}
    <MixedTreeSearch
      {view}
      attributes={{
        ...searchInputProps,
        class: twMerge('input min-w-0 flex-1', searchInputProps.class),
      }}>{@render primitiveVisibilityToggle(false)}</MixedTreeSearch
    >
  {/snippet}
  {#snippet treeNavigation()}
    <TreeView
      collection={treeCollection}
      expandedValue={treeExpandedValue}
      selectedValue={view.activeNodeId ? [view.activeNodeId] : []}
      onExpandedChange={(details) => {
        if (!view.searchQuery.trim()) {
          view.expandedNodes = details.expandedValue;
        }
      }}
      onSelectionChange={(details) => {
        const selectedValue = details.selectedValue[0];
        if (selectedValue) {
          navContext.selectPath(selectedValue);
          const node = findMixedNodeByPath(treeNodes, selectedValue);
          if (node) handleNodeClick(node);
        }
      }}
    >
      <TreeView.Tree aria-label={message('mixed.treeLabel')} class="w-full space-y-1">
        {#each treeCollection.rootNode.children || [] as node, index (node.id)}
          {@render renderTreeNode(node, [index])}
        {/each}
      </TreeView.Tree>
    </TreeView>
  {/snippet}
  {#snippet breadcrumbs()}
    <nav
      aria-label={message('mixed.navigationPath')}
      class="mb-3 flex flex-wrap items-center gap-2 text-sm"
    >
      {#each breadcrumbSegments as segment, index (segment.path)}
        <button
          type="button"
          onclick={() => navContext.selectPath(segment.path)}
          class="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
          aria-label={segment.accessibleLabel}
        >
          <MixedBreadcrumbContent {segment} activePath={view.activeNodeId} {JsonTypeIcon} />
        </button>
        {#if index < breadcrumbSegments.length - 1}
          <span>/</span>
        {/if}
      {/each}
    </nav>
  {/snippet}
  {#snippet viewButton()}
    <Tooltip
      open={nestedViewHintOpen}
      openDelay={0}
      {getRootNode}
      positioning={{ placement: 'top', strategy: 'fixed' }}
    >
      <Tooltip.Trigger>
        {#snippet element(triggerProps)}
          <button
            {...triggerProps}
            type="button"
            class="btn preset-filled"
            onclick={() => parentNavContext?.viewPath(treeNodePath)}
            title={nestedViewLabel}
            aria-label={nestedViewLabel}
            onfocus={() => {
              nestedViewHintFocused = true;
              nestedViewHintDismissed = false;
              window.addEventListener('keydown', dismissNestedViewHint, true);
            }}
            onblur={() => {
              nestedViewHintFocused = false;
              window.removeEventListener('keydown', dismissNestedViewHint, true);
            }}
            onpointerenter={() => {
              clearTimeout(nestedViewHoverTimer);
              nestedViewHoverTimer = setTimeout(() => {
                nestedViewHintHovered = true;
                nestedViewHintDismissed = false;
              }, 80);
            }}
            onpointerleave={() => {
              clearTimeout(nestedViewHoverTimer);
              nestedViewHintHovered = false;
            }}
          >
            <EyeOutline class="h-4 w-4" />
          </button>
        {/snippet}
      </Tooltip.Trigger>
      <TooltipContent
        target={resolvePortalTarget() ?? undefined}
        positionerClass="pointer-events-none"
        class="card preset-filled-surface-950-50 pointer-events-none px-3 py-2 text-sm shadow-xl"
        >{nestedViewLabel}</TooltipContent
      >
    </Tooltip>{/snippet}
</MixedContent>

{#snippet primitiveVisibilityToggle(active: boolean)}
  <Tooltip
    open={primitiveHintOpen}
    openDelay={0}
    {getRootNode}
    positioning={{ placement: 'top', strategy: 'fixed' }}
  >
    <Tooltip.Trigger>
      {#snippet element(triggerProps)}
        <button
          {...triggerProps}
          {...treeActionButtonProps(
            `rounded p-0.5 ${
              active
                ? view.showPrimitivesInTree
                  ? 'text-white'
                  : 'text-white opacity-50'
                : view.showPrimitivesInTree
                  ? 'text-primary-500 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500'
            }`,
            view.primitiveToggleLabel,
          )}
          title={view.primitiveToggleLabel}
          onclick={view.togglePrimitives}
          onfocus={() => {
            primitiveHintFocused = true;
            primitiveHintDismissed = false;
            window.addEventListener('keydown', dismissPrimitiveHint, true);
          }}
          onblur={() => {
            primitiveHintFocused = false;
            window.removeEventListener('keydown', dismissPrimitiveHint, true);
          }}
          onpointerenter={() => {
            primitiveHintHovered = true;
            primitiveHintDismissed = false;
          }}
          onpointerleave={() => (primitiveHintHovered = false)}
        >
          {#if view.showPrimitivesInTree}
            <EyeOutline class="h-3 w-3" />
          {:else}
            <EyeSlashOutline class="h-3 w-3" />
          {/if}
        </button>
      {/snippet}
    </Tooltip.Trigger>
    <TooltipContent target={resolvePortalTarget() ?? undefined}
      >{view.primitiveToggleLabel}</TooltipContent
    >
  </Tooltip>
{/snippet}

{#snippet treeNodeAction(
  node: TreeNode<TreeNodeData>,
  active: boolean,
  action: 'rename' | 'delete',
)}
  {@const actionProps = actions.nodeAction(node, action)}
  {@const hintKey = JSON.stringify([node.id, action])}
  <Tooltip
    open={(treeHintFocused === hintKey || treeHintHovered === hintKey) &&
      treeHintDismissed !== hintKey}
    openDelay={0}
    {getRootNode}
    positioning={{ placement: 'top', strategy: 'fixed' }}
  >
    <Tooltip.Trigger>
      {#snippet element(triggerProps)}
        <button
          {...triggerProps}
          {...treeActionButtonProps(
            action === 'rename'
              ? `rounded p-0.5 ${
                  active
                    ? 'hover:bg-primary-800 text-white'
                    : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
                }`
              : `rounded p-0.5 ${
                  active
                    ? 'text-white hover:bg-red-600'
                    : 'text-red-500 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900'
                }`,
            actionProps.title,
          )}
          {...actionProps}
          onfocus={() => {
            view.focusedNodeId = node.id;
            treeHintFocused = hintKey;
            treeHintDismissed = undefined;
            window.addEventListener('keydown', dismissTreeHint, true);
          }}
          onblur={() => {
            view.focusedNodeId = undefined;
            treeHintFocused = undefined;
            window.removeEventListener('keydown', dismissTreeHint, true);
          }}
          onpointerenter={() => {
            treeHintHovered = hintKey;
            treeHintDismissed = undefined;
          }}
          onpointerleave={() => (treeHintHovered = undefined)}
        >
          {#if action === 'rename'}<PenOutline class="h-3 w-3" />{:else}<TrashBinOutline
              class="h-3 w-3"
            />{/if}
        </button>
      {/snippet}
    </Tooltip.Trigger>
    <TooltipContent target={resolvePortalTarget() ?? undefined}>{actionProps.title}</TooltipContent>
  </Tooltip>
{/snippet}

{#snippet renderTreeNode(node: TreeNode<TreeNodeData>, indexPath: number[])}
  <TreeView.NodeProvider value={{ node, indexPath }}>
    {@const active = view.activeNodeId === node.id}
    {#if node.children && node.children.length > 0}
      <TreeView.Branch class="w-full">
        <TreeView.BranchControl
          class={twMerge(
            'group rounded-container flex w-full items-center gap-2 text-start',
            active ? 'preset-filled-primary-500' : 'hover:preset-tonal',
          )}
          onclick={() => {
            if (node.data?.path === binding.control.path) {
              navContext.selectPath(node.data.path);
            }
          }}
        >
          <TreeView.BranchIndicator>
            <ChevronRightIcon class="size-4 transition-transform data-[state=open]:rotate-90" />
          </TreeView.BranchIndicator>
          <TreeView.BranchText class="flex min-w-0 flex-1 items-center gap-1">
            {@render treeRow(node, active)}
          </TreeView.BranchText>
        </TreeView.BranchControl>
        <TreeView.BranchContent>
          <TreeView.BranchIndentGuide class="border-surface-200-800" />
          {#each node.children as childNode, childIndex (childNode.id)}
            {@render renderTreeNode(childNode, [...indexPath, childIndex])}
          {/each}
        </TreeView.BranchContent>
      </TreeView.Branch>
    {:else}
      <TreeView.Item
        class={twMerge(
          'group rounded-container flex w-full items-center gap-2 text-start',
          active ? 'preset-filled-primary-500' : 'hover:preset-tonal',
        )}
      >
        <div class="flex min-w-0 flex-1 items-center gap-1">
          {@render treeRow(node, active)}
        </div>
      </TreeView.Item>
    {/if}
  </TreeView.NodeProvider>
{/snippet}

{#snippet treeRow(node: TreeNode<TreeNodeData>, active: boolean)}
  <MixedTreeRow
    {node}
    {active}
    {view}
    control={binding.control}
    focusedId={view.focusedNodeId}
    {JsonTypeIcon}
    {ContainerValidationIndicator}
    {CheckIcon}
    {XIcon}
    {treeNodeAction}
    {renameInputProps}
  >
    {#snippet button(attributes, icon)}<button
        type="button"
        class="btn-icon preset-tonal size-8"
        {...attributes}>{@render icon()}</button
      >{/snippet}
  </MixedTreeRow>
{/snippet}
