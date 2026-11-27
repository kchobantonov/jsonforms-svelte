<script lang="ts" generics="Wrapper extends Record<string, unknown>">
  import type { MixedFrameProps } from './MixedFrameHeader.svelte';
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import type { ConfirmationOperation } from '../interaction/confirmation';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  import type { useMixedTreeView } from './mixedTreeView.svelte';

  import MixedStructuredContent from './MixedStructuredContent.svelte';
  import MixedInlineContent from './MixedInlineContent.svelte';
  type StructuredProps = ComponentProps<typeof MixedStructuredContent>;
  type InlineProps = ComponentProps<typeof MixedInlineContent>;
  const {
    view,
    binding,
    ConfirmationDialog,
    Frame,
    ControlWrapper,
    typeSelector,
    ContainerValidationIndicator,
    treeToolbar,
    treeNavigation,
    breadcrumbs,
    viewButton,
    Pane,
    SplitPane,
    constrainTree,
    resizeLabel,
    rowClass,
    selectorClass,
    valueClass,
    labelPadding,
  }: {
    view: ReturnType<typeof useMixedTreeView>;
    binding: InlineProps['binding'] & { controlWrapper: Wrapper };
    ConfirmationDialog: Component<{
      operation: ConfirmationOperation;
      onAccept(): void;
      onCancel(): void;
    }>;
    Frame: Component<MixedFrameProps>;
    ControlWrapper: Component<Wrapper & { errors: string; children: Snippet }>;
    typeSelector: Snippet<[boolean]>;
    ContainerValidationIndicator: Component<
      ReturnType<ReturnType<typeof useMixedTreeView>['validationAt']>
    >;
  } & Pick<
    StructuredProps,
    | 'Pane'
    | 'SplitPane'
    | 'constrainTree'
    | 'resizeLabel'
    | 'treeToolbar'
    | 'treeNavigation'
    | 'breadcrumbs'
  > &
    Pick<InlineProps, 'rowClass' | 'selectorClass' | 'valueClass' | 'labelPadding' | 'viewButton'> =
    $props();
  const message = useRendererMessages();
  const { actions, frame, editor, navigation } = $derived(view);
  const { confirmation } = $derived(editor);
</script>

{#snippet wrapper(children: Snippet)}
  <ControlWrapper {...binding.controlWrapper} errors={editor.mixedErrors}
    >{@render children()}</ControlWrapper
  >
{/snippet}

{#if binding.control.visible}
  {#if actions.treeDeletion.pending}
    <ConfirmationDialog
      operation="delete"
      onAccept={actions.treeDeletion.accept}
      onCancel={actions.treeDeletion.cancel}
    />
  {/if}
  {#each confirmation.pending ? [confirmation.pending] : [] as request (request)}
    <ConfirmationDialog
      operation={request.operation}
      onAccept={() => confirmation.accept(request)}
      onCancel={() => confirmation.cancel(request)}
    />
  {/each}
  {#if navigation.structuredLayout === 'code'}
    {#snippet unavailable()}<p role="status">{message('mixed.codeUnavailable')}</p>{/snippet}
    {@render wrapper(unavailable)}
  {:else if view.showTreeView || (navigation.isRoot && view.isSelectedComplexType)}
    <Frame
      expanded={frame.expanded}
      collapsible={frame.collapsible}
      label={binding.control.label || message('mixed.value')}
      onExpandedChange={(expanded) => {
        frame.expanded = expanded;
      }}
    >
      {#snippet indicator()}<ContainerValidationIndicator
          {...view.validationAt(binding.control.path)}
        />{/snippet}
      {#snippet selector()}
        {#snippet framedSelector()}{@render typeSelector(true)}{/snippet}
        {@render wrapper(framedSelector)}
      {/snippet}
      <MixedStructuredContent
        {view}
        control={binding.control}
        navigationKey={view.navigationKey}
        {SplitPane}
        {Pane}
        {treeNavigation}
        {treeToolbar}
        {breadcrumbs}
        {constrainTree}
        {resizeLabel}
      />
    </Frame>
  {:else}
    <MixedInlineContent
      {view}
      {binding}
      {wrapper}
      {labelPadding}
      {rowClass}
      {selectorClass}
      {valueClass}
      {viewButton}
    >
      {#snippet selector()}{@render typeSelector(false)}{/snippet}
    </MixedInlineContent>
  {/if}
{/if}
