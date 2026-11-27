<script lang="ts">
  import { type ValidationIconProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import ValidationBadge from './ValidationBadge.svelte';

  let { errors, showCount = true, ...rest }: ValidationIconProps = $props();
</script>

{#if errors && errors.length > 0}
  <div class="relative shrink-0">
    <ValidationBadge {errors} color="red" border={true} {showCount} {...rest}>
      <ExclamationCircleOutline
        color="red"
        class={showCount ? 'text-white dark:text-white' : 'size-4 text-red-600 dark:text-red-400'}
      ></ExclamationCircleOutline>
    </ValidationBadge>
  </div>
{/if}
