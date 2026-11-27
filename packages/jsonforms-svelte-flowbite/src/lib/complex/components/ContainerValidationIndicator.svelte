<script lang="ts">
  import type { ErrorObject } from 'ajv';
  import { Indicator } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import ValidationPopover from '../../controls/components/ValidationPopover.svelte';
  let {
    show,
    count,
    errors = [],
  }: { show: boolean; count?: number; errors?: ErrorObject[] } = $props();
</script>

<ValidationPopover visible={show} {errors} container>
  {#snippet triggerContent()}
    <span class="relative inline-flex text-red-600 dark:text-red-400">
      {#if count !== undefined}<Indicator color="red" border placement="top-right" class="font-bold"
          ><span class="text-xs font-bold text-white">{count}</span></Indicator
        >{/if}
      <ExclamationCircleOutline class="size-4" aria-hidden="true" />
    </span>
  {/snippet}
</ValidationPopover>
