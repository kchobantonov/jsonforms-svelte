<script lang="ts">
  import { MonacoControl } from '@chobantonov/jsonforms-svelte-extended';
  import {
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ControlWrapper, useSkeletonControl } from '@chobantonov/jsonforms-svelte-skeleton';

  const props: ControlProps = $props();
  const binding = useSkeletonControl(useJsonFormsControl(props));
  const monacoStyle = [
    '--jsonforms-monaco-border: var(--color-surface-200-800, #e2e8f0)',
    '--jsonforms-monaco-error: var(--color-error-500, #ef4444)',
    '--jsonforms-monaco-focus: var(--color-primary-500, #3b82f6)',
    '--jsonforms-monaco-focus-border: var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-focus-shadow: none',
    '--jsonforms-monaco-radius: var(--radius-base, 0.375rem)',
    '--jsonforms-monaco-background: var(--color-surface-50-950, Canvas)',
    '--jsonforms-monaco-foreground: var(--color-surface-950-50, CanvasText)',
    '--jsonforms-monaco-button-background: var(--color-surface-100-900, Canvas)',
    '--jsonforms-monaco-button-hover-background: var(--color-surface-200-800, #e2e8f0)',
  ].join('; ');
</script>

<MonacoControl {props} {binding} class="jsonforms-skeleton-monaco" style={monacoStyle}>
  {#snippet wrapper(errors, children)}
    <ControlWrapper {...binding.controlWrapper} {errors}>{@render children()}</ControlWrapper>
  {/snippet}
</MonacoControl>
