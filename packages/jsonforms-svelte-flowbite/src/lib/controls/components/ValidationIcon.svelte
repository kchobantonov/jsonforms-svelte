<script lang="ts">
  import type { ErrorObject } from 'ajv';
  import { ExclamationCircleSolid } from 'flowbite-svelte-icons';
  import type { HTMLAttributes } from 'svelte/elements';
  import ValidationBadge from './ValidationBadge.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
    errors: ErrorObject[];
  }

  let { errors, ...rest }: Props = $props();
</script>

{#if errors && errors.length > 0}
  <div class="relative shrink-0">
    <ValidationBadge {errors} color="red" border={true} {...rest}>
      <ExclamationCircleSolid color="red" class="text-white dark:text-white"
      ></ExclamationCircleSolid>
    </ValidationBadge>
  </div>
{/if}
