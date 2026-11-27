<script module lang="ts">
  import type { Component, Snippet } from 'svelte';
  type TriggerAttributes = {
    type: 'button';
    'aria-label': string;
    'aria-expanded': boolean;
    'aria-controls': string;
  };
  export interface MixedFrameProps {
    expanded: boolean;
    collapsible: boolean;
    label: string;
    selector: Snippet;
    indicator?: Snippet;
    children: Snippet;
    onExpandedChange(expanded: boolean): void;
  }
</script>

<script lang="ts">
  const {
    expanded,
    collapsible,
    label,
    selector,
    indicator,
    contentId,
    class: frameClass = 'flex items-center gap-3',
    selectorClass = 'min-w-32 shrink-0',
    trigger,
    Trigger,
    Chevron,
  }: Omit<MixedFrameProps, 'children' | 'onExpandedChange'> & {
    contentId: string;
    class?: string;
    selectorClass?: string;
    trigger?: Snippet<[TriggerAttributes, string]>;
    Trigger?: Component<
      TriggerAttributes & { class: string; 'data-mixed-collapse': boolean; children: Snippet }
    >;
    Chevron?: Component<{ class: string }>;
  } = $props();
</script>

<div class={frameClass} data-mixed-frame-header>
  <div class={selectorClass}>{@render selector()}</div>
  {@render indicator?.()}
  {#if collapsible}
    {@const attributes = {
      type: 'button' as const,
      'aria-label': label,
      'aria-expanded': expanded,
      'aria-controls': contentId,
    }}
    {@const iconClass = expanded ? 'size-4 rotate-180' : 'size-4'}
    {#if trigger}{@render trigger(attributes, iconClass)}{:else if Trigger && Chevron}
      <Trigger
        {...attributes}
        data-mixed-collapse
        class="flex min-w-0 flex-1 items-center justify-end gap-3 rounded-md p-2 text-start focus-visible:outline-2"
      >
        <Chevron class={iconClass} />
      </Trigger>
    {/if}
  {:else}
    <span class="min-w-0 flex-1"></span>
  {/if}
</div>
