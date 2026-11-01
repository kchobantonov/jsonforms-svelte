<script lang="ts">
  import type { ErrorObject } from 'ajv';
  import { ExclamationCircleSolid } from 'flowbite-svelte-icons';
  import type { HTMLAttributes } from 'svelte/elements';
  import ValidationBadge from './ValidationBadge.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
    errors: ErrorObject[];
    showCount?: boolean;
  }

  let { errors, showCount = true, ...rest }: Props = $props();
</script>

{#if errors && errors.length > 0}
  <div class="relative shrink-0">
    <ValidationBadge {errors} color="red" border={true} {showCount} {...rest}>
      <ExclamationCircleSolid
        color="red"
        class={showCount ? 'text-white dark:text-white' : 'size-4 text-red-600 dark:text-red-400'}
      ></ExclamationCircleSolid>
    </ValidationBadge>
  </div>
{/if}
