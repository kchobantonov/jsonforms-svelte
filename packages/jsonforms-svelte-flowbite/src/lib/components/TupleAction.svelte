<script lang="ts">
  import type { TupleActionProps } from '@chobantonov/jsonforms-svelte';
  import { Button, Tooltip } from 'flowbite-svelte';
  import { PlusOutline, TrashBinOutline } from 'flowbite-svelte-icons';
  let { label, disabled = false, kind = 'add', onclick }: TupleActionProps = $props();
  const iconOnly = $derived(kind === 'add' || kind === 'delete');
</script>

{#if iconOnly}
  <span class="inline-flex">
    <Button
      type="button"
      size="xs"
      color={kind === 'delete' ? 'red' : 'primary'}
      {disabled}
      {onclick}
      aria-label={label}
      title={label}
    >
      {#if kind === 'add'}<PlusOutline class="h-4 w-4" />{:else}<TrashBinOutline
          class="h-4 w-4"
        />{/if}
    </Button>
  </span><Tooltip>{label}</Tooltip>
{:else}
  <Button
    type="button"
    size="sm"
    color={kind === 'remove' ? 'red' : 'alternative'}
    {disabled}
    {onclick}>{label}</Button
  >
{/if}
