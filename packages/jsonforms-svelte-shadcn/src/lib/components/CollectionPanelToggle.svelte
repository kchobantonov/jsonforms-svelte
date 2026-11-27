<script lang="ts">
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { ChevronDownIcon as Down, ChevronUpIcon as Up } from '$lib/components/icons';
  import type { useArrayTable } from '@chobantonov/jsonforms-svelte-renderer-common';
  const {
    panel,
    id,
    label,
  }: {
    panel: ReturnType<typeof useArrayTable>['panel'];
    id: string;
    label: string;
  } = $props();
  const Icon = $derived(panel.collapsed ? Down : Up);
</script>

{#if panel.collapsible}
  <Button type="button" variant="ghost" size="icon-sm" {...panel.toggleAttributes(id, label)}
    ><Icon class="h-4 w-4" /></Button
  >
{/if}
