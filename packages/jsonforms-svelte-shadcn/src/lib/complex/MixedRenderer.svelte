<script lang="ts">
  import { MixedTreeSearch } from '@chobantonov/jsonforms-svelte-renderer-common';
  import TypeChoicePopup from './components/TypeChoicePopup.svelte';
  import TooltipContent from '../components/TooltipContent.svelte';
  import {
    useRendererMessages,
    useMixedTreeView,
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
  } from '$lib/components/icons';
  import * as Breadcrumb from '@jsonforms-svelte-shadcn-ui/breadcrumb';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Collapsible from '@jsonforms-svelte-shadcn-ui/collapsible';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { twMerge } from 'tailwind-merge';
  import {
    NavigationContextSymbol,
    setIsDynamicProperty,
    useCombinatorTranslations,
    useShadcnControl,
  } from '../util';
  import { buildTreeFromData, type TreeNode, type TreeNodeData } from './util/treeBuilder.svelte';

  // ============================================================================
  // Props & Core Setup
  // ============================================================================

  const props: RendererProps<ControlElement> = $props();
  const binding = useCombinatorTranslations(useShadcnControl(useJsonFormsControl(props)));

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
  const { selectedIndex, selectItems, requestTypeChange } = $derived(editor);
  const { navContext, parentNavContext, treeNodePath } = $derived(navigation);
  function handleSelectValueChange(value: string): void {
    if (!binding.control.enabled || binding.control.readonly) return;
    const selectedValue = value || null;
    const newIndex = selectedValue ? parseInt(selectedValue, 10) : null;

    requestTypeChange(newIndex);
  }

  // use the default value since all properties are dynamic so preserve the property key
  setIsDynamicProperty(true);

  const searchInputProps = $derived(view.searchAttributes(binding.shadcnProps('input')));

  const renameInputProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'text',
      class: twMerge(
        'input min-w-0 flex-1 text-sm',
        actions.renameError ? 'border-red-500' : 'border-primary-500',
        shadcnProps.class,
      ),
    };
  });

  const treeActionButtonProps = (className: string, ariaLabel: string) => {
    const shadcnProps = binding.shadcnProps('button');

    return {
      ...shadcnProps,
      'aria-label': ariaLabel,
      class: twMerge(className, shadcnProps.class),
    };
  };

  const selectedTypeValue = $derived(selectedIndex == null ? undefined : selectedIndex.toString());
  const selectedTypeLabel = $derived(
    selectItems.find((item) => item.value === selectedTypeValue)?.name,
  );
  function treeSelection(node: TreeNode<TreeNodeData>) {
    function select() {
      navContext.selectPath(node.id);
      handleNodeClick(node);
    }
    return {
      onclick: select,
      onkeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          select();
        }
      },
    };
  }
</script>

{#snippet typeSelector(stopPropagation: boolean)}
  <div class="group relative w-full">
    <Select.Root
      type="single"
      bind:value={() => selectedTypeValue ?? '', handleSelectValueChange}
      disabled={!binding.control.enabled}
      required={binding.control.required}
      {...binding.shadcnProps('Select')}
    >
      <Select.Trigger
        id={`${binding.control.id}-input-selector`}
        class={twMerge(
          binding.styles.control.input,
          'h-10 w-full data-[size=default]:h-10',
          selectedIndex != null ? 'pe-16' : '',
        )}
        aria-invalid={!!binding.control.errors}
        aria-label={message('mixed.typeLabel')}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        onclick={stopPropagation ? (event: MouseEvent) => event.stopPropagation() : undefined}
        onmousedown={stopPropagation ? (event: MouseEvent) => event.stopPropagation() : undefined}
      >
        <span
          class={selectedTypeLabel ? 'min-w-0 truncate' : 'text-muted-foreground min-w-0 truncate'}
        >
          {selectedTypeLabel ?? message('mixed.typePlaceholder')}
        </span>
      </Select.Trigger>
      <TypeChoicePopup items={selectItems} />
    </Select.Root>
    {#if canClearType && selectedIndex !== null && selectedIndex !== undefined}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute inset-y-0 end-8 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        {...view.clearTypeButton(stopPropagation)}
      >
        <XIcon class="size-4 shrink-0" />
      </Button>
    {/if}
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
  labelPadding="1.25rem"
>
  {#snippet treeToolbar()}
    <MixedTreeSearch
      {view}
      {Input}
      attributes={{
        ...searchInputProps,
        class: twMerge('input min-w-0 flex-1', searchInputProps.class),
      }}>{@render primitiveVisibilityToggle(false)}</MixedTreeSearch
    >
  {/snippet}
  {#snippet treeNavigation()}
    <div role="tree" aria-label={message('mixed.treeLabel')} class="w-full space-y-1">
      {#each filteredTreeNodes as node, index (node.id)}
        {@render renderTreeNode(node, [index])}
      {/each}
    </div>
  {/snippet}
  {#snippet breadcrumbs()}
    <Breadcrumb.Root aria-label={message('mixed.navigationPath')} class="mb-3">
      <Breadcrumb.List>
        {#each breadcrumbSegments as segment, index (segment.path)}
          <Breadcrumb.Item>
            <Button
              variant="link"
              size="xs"
              onclick={() => navContext.selectPath(segment.path)}
              aria-label={segment.accessibleLabel}
            >
              <MixedBreadcrumbContent {segment} activePath={view.activeNodeId} {JsonTypeIcon} />
            </Button>
          </Breadcrumb.Item>
          {#if index < breadcrumbSegments.length - 1}
            <Breadcrumb.Separator />
          {/if}
        {/each}
      </Breadcrumb.List>
    </Breadcrumb.Root>
  {/snippet}
  {#snippet viewButton()}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#snippet child({ props: triggerProps })}
            <Button
              {...triggerProps}
              size="icon"
              onclick={() => parentNavContext?.viewPath(treeNodePath)}
              title={nestedViewLabel}
              aria-label={nestedViewLabel}
            >
              <EyeOutline class="h-4 w-4" />
            </Button>
          {/snippet}
        </Tooltip.Trigger>
        <TooltipContent>{nestedViewLabel}</TooltipContent>
      </Tooltip.Root>
    </Tooltip.Provider>{/snippet}
</MixedContent>

{#snippet primitiveVisibilityToggle(active: boolean)}
  <Tooltip.Provider
    ><Tooltip.Root
      ><Tooltip.Trigger>
        {#snippet child({ props: triggerProps })}
          <Button
            {...triggerProps}
            variant="ghost"
            size="icon-xs"
            {...treeActionButtonProps(
              `rounded p-0.5 ${
                active
                  ? view.showPrimitivesInTree
                    ? 'text-foreground'
                    : 'text-foreground opacity-60'
                  : view.showPrimitivesInTree
                    ? 'text-primary-500 dark:text-primary-400'
                    : 'text-gray-400 dark:text-gray-500'
              }`,
              view.primitiveToggleLabel,
            )}
            title={view.primitiveToggleLabel}
            onclick={view.togglePrimitives}
          >
            {#if view.showPrimitivesInTree}
              <EyeOutline class="h-3 w-3" />
            {:else}
              <EyeSlashOutline class="h-3 w-3" />
            {/if}
          </Button>
        {/snippet}
      </Tooltip.Trigger><TooltipContent>{view.primitiveToggleLabel}</TooltipContent></Tooltip.Root
    ></Tooltip.Provider
  >
{/snippet}

{#snippet treeNodeAction(
  node: TreeNode<TreeNodeData>,
  active: boolean,
  action: 'rename' | 'delete',
)}
  {@const actionProps = actions.nodeAction(node, action)}
  <Tooltip.Provider>
    <Tooltip.Root>
      <Tooltip.Trigger>
        {#snippet child({ props: triggerProps })}
          <Button
            {...triggerProps}
            variant="ghost"
            size="icon-xs"
            {...treeActionButtonProps(
              action === 'rename'
                ? `rounded p-0.5 ${
                    active
                      ? 'text-foreground hover:bg-muted'
                      : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'
                  }`
                : 'rounded p-0.5 text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900',
              actionProps.title,
            )}
            {...actionProps}
          >
            {#if action === 'rename'}<PenOutline class="h-3 w-3" />{:else}<TrashBinOutline
                class="h-3 w-3"
              />{/if}
          </Button>
        {/snippet}
      </Tooltip.Trigger>
      <TooltipContent>{actionProps.title}</TooltipContent>
    </Tooltip.Root>
  </Tooltip.Provider>
{/snippet}

{#snippet renderTreeNode(node: TreeNode<TreeNodeData>, indexPath: number[])}
  {@const active = view.activeNodeId === node.id}
  {#if node.children && node.children.length > 0}
    <Collapsible.Root
      open={treeExpandedValue.includes(node.id)}
      onOpenChange={(open) => {
        if (!view.searchQuery.trim()) {
          view.expandedNodes = open
            ? [...new Set([...view.expandedNodes, node.id])]
            : view.expandedNodes.filter((value) => value !== node.id);
        }
      }}
      class="w-full"
    >
      <div
        role="treeitem"
        tabindex={0}
        aria-expanded={treeExpandedValue.includes(node.id)}
        aria-selected={active}
        class={twMerge(
          'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start',
          active ? 'bg-accent text-foreground' : 'hover:bg-accent/60',
        )}
        {...treeSelection(node)}
      >
        <Collapsible.Trigger
          class="hover:bg-muted inline-flex size-6 items-center justify-center rounded-md"
        >
          <ChevronRightIcon class="size-4 transition-transform group-data-[state=open]:rotate-90" />
        </Collapsible.Trigger>
        <div class="flex min-w-0 flex-1 items-center gap-1">
          {@render treeRow(node, active)}
        </div>
      </div>
      <Collapsible.Content role="group" class="border-border ms-3 border-s ps-3">
        {#each node.children as childNode, childIndex (childNode.id)}
          {@render renderTreeNode(childNode, [...indexPath, childIndex])}
        {/each}
      </Collapsible.Content>
    </Collapsible.Root>
  {:else}
    <div
      role="treeitem"
      tabindex={0}
      aria-selected={active}
      class={twMerge(
        'group flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-start',
        active ? 'bg-accent text-foreground' : 'hover:bg-accent/60',
      )}
      {...treeSelection(node)}
    >
      <div class="flex min-w-0 flex-1 items-center gap-1">
        {@render treeRow(node, active)}
      </div>
    </div>
  {/if}
{/snippet}

{#snippet treeRow(node: TreeNode<TreeNodeData>, active: boolean)}
  <MixedTreeRow
    {node}
    {active}
    {view}
    control={binding.control}
    focusedId={view.focusedNodeId}
    onFocusChange={(id) => (view.focusedNodeId = id)}
    {JsonTypeIcon}
    {ContainerValidationIndicator}
    {CheckIcon}
    {XIcon}
    {treeNodeAction}
    {renameInputProps}
    RenameInput={Input}
  >
    {#snippet button(attributes, icon)}<Button
        type="button"
        size="icon"
        variant="ghost"
        {...attributes}>{@render icon()}</Button
      >{/snippet}
  </MixedTreeRow>
{/snippet}
