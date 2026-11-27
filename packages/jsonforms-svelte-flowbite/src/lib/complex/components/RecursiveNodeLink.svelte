<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import type { RecursiveTreeLinkProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  let { onclick, children }: RecursiveTreeLinkProps = $props();
</script>

<Button type="button" color="alternative" {onclick}>{@render children()}</Button>
