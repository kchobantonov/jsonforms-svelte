<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { useChoiceCards } from './choiceCards.svelte';
  import { isCardPresentation } from './choiceCards';
  import CardPresentation from '../layout/CardPresentation.svelte';
  type Cards = ReturnType<typeof useChoiceCards>;
  const {
    cards,
    choice,
    active,
    children,
  }: {
    cards: Cards;
    choice: Cards['choices'][number];
    active: boolean;
    children?: Snippet;
  } = $props();
  const content = $derived(
    active
      ? (choice.selectedContent ?? choice.content)
      : (choice.content ?? choice.selectedContent),
  );
  const alternate = $derived(active ? choice.content : choice.selectedContent);
</script>

{#snippet presentation(element: typeof content)}
  {#if isCardPresentation(element)}
    <CardPresentation
      schema={cards.binding.control.schema}
      uischema={element}
      path={cards.binding.control.path}
      enabled={cards.enabled}
      renderers={cards.binding.control.renderers}
      cells={cards.binding.control.cells}
    />
  {/if}
{/snippet}

<div class="grid min-w-0 flex-1">
  <div style="grid-area: 1 / 1">
    {@render presentation(content)}
    {#if children}{@render children()}{:else}<span>{choice.label}</span>{/if}
  </div>
  {#if alternate !== content && isCardPresentation(alternate)}
    <div style="grid-area: 1 / 1; visibility: hidden" inert aria-hidden="true">
      {@render presentation(alternate)}
      <span>{choice.label}</span>
    </div>
  {/if}
</div>
