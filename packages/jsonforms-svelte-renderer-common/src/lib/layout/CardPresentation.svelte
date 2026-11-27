<script lang="ts">
  import { setContext } from 'svelte';
  import { type RendererProps } from '../core/jsonFormsCompositions.svelte.js';
  import DispatchRenderer from '../core/DispatchRenderer.svelte';
  import { CardPresentationContext } from '../composition/choiceCards';

  const props: RendererProps = $props();
  setContext(CardPresentationContext, true);
</script>

<div class="card-presentation" inert aria-hidden="true" style="pointer-events: none">
  <DispatchRenderer {...props} />
</div>

<style>
  .card-presentation :global(img) {
    align-self: flex-start;
  }
</style>
