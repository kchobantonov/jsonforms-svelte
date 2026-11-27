<script lang="ts">
  import { MonacoControl } from '@chobantonov/jsonforms-svelte-extended';
  import {
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ControlWrapper, useFlowbiteControl } from '@chobantonov/jsonforms-svelte-flowbite';

  const props: ControlProps = $props();
  const binding = useFlowbiteControl(useJsonFormsControl(props));
  const monacoStyle = [
    '--jsonforms-monaco-border: light-dark(var(--color-gray-300, #d1d5db), var(--color-gray-600, #4b5563))',
    '--jsonforms-monaco-error: var(--color-red-500, #ef4444)',
    '--jsonforms-monaco-focus: var(--color-primary-500, #3b82f6)',
    '--jsonforms-monaco-focus-border: var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-focus-shadow: 0 0 0 1px var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-radius: 0.5rem',
    '--jsonforms-monaco-background: light-dark(#fff, var(--color-gray-800, #1f2937))',
    '--jsonforms-monaco-foreground: light-dark(#111827, var(--color-gray-50, #f9fafb))',
    '--jsonforms-monaco-button-background: light-dark(#fff, var(--color-gray-700, #374151))',
    '--jsonforms-monaco-button-hover-background: light-dark(var(--color-gray-100, #f3f4f6), var(--color-gray-600, #4b5563))',
  ].join('; ');
</script>

<MonacoControl
  {props}
  {binding}
  class="jsonforms-flowbite-monaco"
  style={monacoStyle}
  surfaceBackground="#fff"
  darkSurfaceBackground="var(--color-gray-800, #1f2937)"
  darkClassBasedTheme
>
  {#snippet wrapper(errors, children)}
    <ControlWrapper {...binding.controlWrapper} {errors}>{@render children()}</ControlWrapper>
  {/snippet}
</MonacoControl>
