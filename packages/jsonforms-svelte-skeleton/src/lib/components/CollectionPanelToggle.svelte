<script lang="ts">
  import { ChevronDownIcon as Down, ChevronUpIcon as Up } from '@lucide/svelte';
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
  <button type="button" class="btn btn-sm preset-tonal" {...panel.toggleAttributes(id, label)}
    ><Icon class="h-4 w-4" /></button
  >
{/if}
