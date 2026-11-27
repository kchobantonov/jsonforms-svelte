<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { SectionIndicatorProps, useSectionStatus } from './sectionIndicators.svelte';
  const {
    status,
    props,
    children,
    dataIcon,
    dataClass,
  }: {
    status: ReturnType<typeof useSectionStatus>;
    props: SectionIndicatorProps;
    children: Snippet;
    dataIcon?: Snippet;
    dataClass?: string;
  } = $props();
  const data = $derived(props.showData !== false && status.indicators.hasData);
</script>

{#if status.showValidation || data}
  <span class={`inline-flex shrink-0 items-center gap-1 ${props.class ?? ''}`}>
    {#if status.showValidation}{@render children()}{/if}
    {#if data}
      <span
        role="img"
        aria-label={status.indicators.dataLabel}
        title={status.indicators.dataLabel}
        data-group-indicator
        class={dataClass}
        >{#if dataIcon}{@render dataIcon()}{:else}●{/if}</span
      >
    {/if}
  </span>
{/if}
