<script lang="ts">
  import ErrorSummaryList from '../validation/ErrorSummaryList.svelte';
  import type { useSectionStatus } from './sectionIndicators.svelte';
  const {
    status,
    stopPropagation = false,
  }: { status: ReturnType<typeof useSectionStatus>; stopPropagation?: boolean } = $props();
</script>

{#if status.showSummary}
  <ErrorSummaryList entries={status.summary.entries}>
    {#snippet toggle(label, action, expanded)}
      <button
        type="button"
        class="underline"
        aria-expanded={expanded}
        onclick={(event) => {
          if (stopPropagation) event.stopImmediatePropagation();
          action();
        }}>{label}</button
      >
    {/snippet}
  </ErrorSummaryList>
{:else}
  {status.validationLabel}
{/if}
