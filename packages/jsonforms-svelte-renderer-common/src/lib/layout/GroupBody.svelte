<script lang="ts">
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import InitialFocusView from '../interaction/InitialFocusView.svelte';
  import GroupFooterFields from './GroupFooterFields.svelte';
  import GroupLayoutFields from './GroupLayoutFields.svelte';
  import type { useGroupState } from './groupState.svelte';
  const {
    group,
    layout,
    LayoutRenderer,
    Content,
    children,
    footer,
  }: ComponentProps<typeof GroupLayoutFields> & {
    group: ReturnType<typeof useGroupState>;
    Content?: Component<{
      class?: string;
      'data-object-static-fields'?: boolean;
      children: Snippet;
    }>;
    children?: Snippet;
    footer?: Snippet;
  } = $props();
</script>

{#snippet groupFooter()}
  {#if group.collapsible && group.footer?.length}
    {#if footer}{@render footer()}{:else}<GroupFooterFields
        {layout}
        elements={group.footer}
        framed
      />{/if}
  {/if}
{/snippet}

<InitialFocusView active={!group.collapsed}>
  {#if layout.uischema.elements?.length}
    {#snippet fields()}<GroupLayoutFields {layout} {LayoutRenderer} />{/snippet}
    {#if Content}
      <Content
        data-object-static-fields
        class={group.footer?.length ? 'pb-(--card-spacing)' : undefined}>{@render fields()}</Content
      >
    {:else}
      <div class="px-4 pb-4" data-object-static-fields>{@render fields()}</div>
    {/if}
  {/if}
  {#if children}
    {#if Content}<Content class="mt-(--card-spacing)">{@render children()}</Content>
    {:else}<div class="pr-4 pb-4 pl-4">{@render children()}</div>{/if}
  {/if}
</InitialFocusView>
{@render groupFooter()}
