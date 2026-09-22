<script lang="ts">
  import type { TupleActionProps } from '@chobantonov/jsonforms-svelte';
  import { PlusIcon, Trash2Icon } from '@lucide/svelte';
  let { label, disabled = false, kind = 'add', onclick }: TupleActionProps = $props();
  const iconOnly = $derived(kind === 'add' || kind === 'delete');
</script>

<button
  type="button"
  class={(iconOnly ? 'btn-icon btn-icon-sm ' : 'btn btn-sm ') +
    (kind === 'delete' || kind === 'remove' ? 'preset-filled-error-500' : 'preset-tonal')}
  {disabled}
  {onclick}
  aria-label={label}
  title={label}
>
  {#if kind === 'add'}<PlusIcon class="size-4" />{:else if kind === 'delete'}<Trash2Icon
      class="size-4"
    />{:else}{label}{/if}
</button>
