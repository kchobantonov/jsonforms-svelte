<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { useChoiceCards } from './choiceCards.svelte';
  import CombinatorProperties from './CombinatorProperties.svelte';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  const { cards, children }: { cards: ReturnType<typeof useChoiceCards>; children: Snippet } =
    $props();
  const detail = $derived(cards.selected >= 0 ? cards.choices[cards.selected] : undefined);
</script>

{#if cards.branchMode}
  <CombinatorProperties
    schema={cards.binding.control.schema}
    combinatorKeyword="oneOf"
    path={cards.binding.control.path}
    rootSchema={cards.binding.control.rootSchema}
  />
{/if}
{@render children()}
{#if cards.branchMode && detail?.schema && detail.uischema}
  <div class="mt-4">
    <DispatchRenderer
      schema={detail.schema}
      uischema={detail.uischema}
      path={cards.binding.control.path}
      enabled={cards.enabled}
      renderers={cards.binding.control.renderers}
      cells={cards.binding.control.cells}
    />
  </div>
{/if}
