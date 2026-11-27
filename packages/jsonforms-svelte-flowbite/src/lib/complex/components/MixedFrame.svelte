<script lang="ts">
  import { ChevronDownOutline } from 'flowbite-svelte-icons';
  import {
    MixedFrameHeader,
    type MixedFrameProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  let {
    expanded,
    collapsible,
    label,
    selector,
    indicator,
    children,
    onExpandedChange,
  }: MixedFrameProps = $props();
  const contentId = $props.id();
</script>

<div>
  <MixedFrameHeader
    {selector}
    {indicator}
    {label}
    {collapsible}
    {expanded}
    {contentId}
    class={`flex min-w-0 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 transition-colors dark:border-gray-700 dark:bg-gray-800 ${collapsible ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : ''}`}
    selectorClass="max-w-sm min-w-32 flex-1"
  >
    {#snippet trigger(attributes, iconClass)}<button
        {...attributes}
        data-mixed-collapse="true"
        class="flex min-w-10 flex-1 items-center justify-end rounded-md p-2 text-start focus-visible:outline-2"
        onclick={() => onExpandedChange(!expanded)}
      >
        <ChevronDownOutline class={iconClass} />
      </button>{/snippet}
  </MixedFrameHeader>
  <div id={contentId} hidden={!expanded} class="pt-3">{@render children()}</div>
</div>
