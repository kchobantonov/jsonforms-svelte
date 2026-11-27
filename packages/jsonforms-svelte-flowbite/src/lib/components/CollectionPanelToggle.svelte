<script lang="ts">
  import { Button } from 'flowbite-svelte';
  import { ChevronDownOutline as Down, ChevronUpOutline as Up } from 'flowbite-svelte-icons';
  import type { useArrayTable } from '@chobantonov/jsonforms-svelte-renderer-common';
  const {
    panel,
    id,
    label,
    compact = false,
  }: {
    panel: ReturnType<typeof useArrayTable>['panel'];
    id: string;
    label: string;
    compact?: boolean;
  } = $props();
  const Icon = $derived(panel.collapsed ? Down : Up);
</script>

{#if panel.collapsible}
  <Button
    type="button"
    color="alternative"
    size={compact ? 'xs' : 'sm'}
    {...panel.toggleAttributes(id, label)}><Icon class="h-4 w-4" /></Button
  >
{/if}
