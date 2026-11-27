<script lang="ts">
  import type { ErrorObject } from 'ajv';
  import type { Snippet } from 'svelte';
  import { Indicator, type BadgeProps } from 'flowbite-svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import ValidationPopover from './ValidationPopover.svelte';
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
    errors: ErrorObject[];
    border?: boolean;
    showCount?: boolean;
    color?: BadgeProps['color'];
    children: Snippet;
  }
  let {
    errors,
    border = false,
    showCount = true,
    color = 'red',
    children,
    ...rest
  }: Props = $props();
</script>

<ValidationPopover
  visible={errors.length > 0}
  {errors}
  attributes={rest}
  single={!showCount}
  optionalContext
  fallback={children}
>
  {#snippet triggerContent()}
    {#if showCount}
      <Indicator {color} {border} placement="top-right" class="font-bold"
        ><span class="text-xs font-bold text-white">{errors.length}</span></Indicator
      >
    {/if}
    {@render children()}
  {/snippet}
</ValidationPopover>
