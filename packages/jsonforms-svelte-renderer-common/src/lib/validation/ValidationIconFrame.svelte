<script lang="ts">
  import type { Component } from 'svelte';
  import type { ValidationIconProps, ValidationBadgeProps } from './validationPresentation';
  const {
    Badge,
    Icon,
    errors,
    showCount = true,
    ...rest
  }: ValidationIconProps & {
    Badge: Component<ValidationBadgeProps>;
    Icon: Component<{ class: string }>;
  } = $props();
</script>

{#if errors?.length}
  <div class="relative shrink-0">
    <Badge {errors} border={true} {showCount} {...rest}>
      <Icon class={`text-error-600 dark:text-error-400 ${showCount ? 'size-5' : 'size-4'}`} />
    </Badge>
  </div>
{/if}
