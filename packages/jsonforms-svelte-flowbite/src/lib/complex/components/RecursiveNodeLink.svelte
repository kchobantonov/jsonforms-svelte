<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import type { RecursiveTreeLinkProps } from '@chobantonov/jsonforms-svelte';
  let { onclick, children }: RecursiveTreeLinkProps = $props();
</script>

<Button type="button" color="alternative" {onclick}>{@render children()}</Button>
