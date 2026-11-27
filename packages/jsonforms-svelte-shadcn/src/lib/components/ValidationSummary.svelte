<script lang="ts">
  import { ErrorSummaryList } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { ComponentProps } from 'svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  const { entries, single }: Omit<ComponentProps<typeof ErrorSummaryList>, 'toggle'> = $props();
</script>

<ErrorSummaryList {entries} {single}>
  {#snippet toggle(label, action, expanded)}
    <Button variant="ghost" size="sm" onclick={action} aria-expanded={expanded}>{label}</Button>
  {/snippet}
</ErrorSummaryList>
