<script lang="ts">
  import { setContext } from 'svelte';
  import type { RendererProps } from '../jsonFormsCompositions.svelte';
  import { CardPresentationContext } from '../choiceCards';
  import DispatchRenderer from './DispatchRenderer.svelte';

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
