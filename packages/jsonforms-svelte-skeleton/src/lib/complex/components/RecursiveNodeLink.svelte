<script lang="ts">
  import type { RecursiveTreeLinkProps } from '@chobantonov/jsonforms-svelte';
  let { onclick, children }: RecursiveTreeLinkProps = $props();
</script>

<button type="button" class="btn variant-link text-primary-600-400" {onclick}
  >{@render children()}</button
>
