<script lang="ts">
  import type { Snippet } from 'svelte';
  import { type ErrorSummaryEntry } from './errorSummary.js';
  import { useRendererMessages } from '../locale/rendererMessages.svelte.js';
  let {
    entries,
    single = false,
    toggle,
  }: {
    entries: ErrorSummaryEntry[];
    single?: boolean;
    toggle: Snippet<[string, () => void, boolean]>;
  } = $props();
  let expanded = $state(false);
  const message = useRendererMessages(true);
  const singleMessage = $derived(single && entries.length === 1);
  $effect(() => {
    if (singleMessage) expanded = false;
  });
</script>

{#snippet errorEntries()}
  <ul
    style="margin-block: 0.5rem; padding-inline-start: 1.25rem; max-height: min(20rem, 35dvh); overflow-y: auto; overflow-wrap: anywhere"
  >
    {#each expanded ? entries : entries.slice(0, 3) as entry, index (index)}
      <li style="margin-block: 0.25rem">
        {#if entry.path}<strong>{entry.path}: </strong>{/if}{entry.message}
      </li>
    {/each}
  </ul>
{/snippet}

{#if singleMessage}
  <span data-error-summary>{entries[0].message}</span>
{:else}
  <div data-error-summary style="max-width: min(28rem, 80vw)">
    <strong
      >{message(entries.length === 1 ? 'validation.containerError' : 'validation.containerErrors', {
        count: entries.length,
      })}</strong
    >
    {@render errorEntries()}
    {#if entries.length > 3}
      {@render toggle(
        message(expanded ? 'validation.showLess' : 'validation.showMore', {
          count: entries.length - 3,
        }),
        () => (expanded = !expanded),
        expanded,
      )}
    {/if}
  </div>
{/if}
