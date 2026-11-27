<script lang="ts">
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import type { RecursiveTreeLinkProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  let { onclick, children }: RecursiveTreeLinkProps = $props();
</script>

<Button type="button" variant="link" {onclick}>{@render children()}</Button>
