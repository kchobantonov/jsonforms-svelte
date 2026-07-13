<script lang="ts">
  import type { ErrorObject } from 'ajv';
  import { CircleAlertIcon as ExclamationCircleSolid } from '$lib/components/icons';
  import type { HTMLAttributes } from 'svelte/elements';
  import ValidationBadge from './ValidationBadge.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
    errors: ErrorObject[];
  }

  let { errors, ...rest }: Props = $props();
</script>

{#if errors && errors.length > 0}
  <div class="relative shrink-0">
    <ValidationBadge {errors} border={true} {...rest}>
      <ExclamationCircleSolid class="text-error-600 dark:text-error-400 size-5" />
    </ValidationBadge>
  </div>
{/if}
