<script lang="ts">
  import ValidationPopover from './ValidationPopover.svelte';
  import type { ValidationBadgeProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  let {
    errors,
    border = false,
    showCount = true,
    color = 'error',
    children,
    ...rest
  }: ValidationBadgeProps = $props();
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
      <span
        class={`absolute -end-1.5 -top-1.5 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold ${color === 'warning' ? 'preset-filled-warning-500' : color === 'surface' ? 'preset-filled-surface-500' : 'preset-filled-error-500'} ${border ? 'ring-surface-50-950 ring-2' : ''}`}
        >{errors.length}</span
      >
    {/if}
    {@render children?.()}
  {/snippet}
</ValidationPopover>
