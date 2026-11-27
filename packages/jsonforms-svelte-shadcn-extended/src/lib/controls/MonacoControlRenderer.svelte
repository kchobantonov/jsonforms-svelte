<script lang="ts">
  import { MonacoControl } from '@chobantonov/jsonforms-svelte-extended';
  import {
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ControlWrapper, useShadcnControl } from '@chobantonov/jsonforms-svelte-shadcn';

  const props: ControlProps = $props();
  const binding = useShadcnControl(useJsonFormsControl(props));
  const monacoStyle = [
    '--jsonforms-monaco-border: hsl(var(--input, 214.3 31.8% 91.4%))',
    '--jsonforms-monaco-error: hsl(var(--destructive, 0 84.2% 60.2%))',
    '--jsonforms-monaco-focus: hsl(var(--ring, 222.2 84% 4.9%))',
    '--jsonforms-monaco-focus-border: var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-focus-shadow: 0 0 0 2px var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-radius: calc(var(--radius, 0.5rem) - 2px)',
    '--jsonforms-monaco-shadow: 0 1px 3px 0 rgb(0 0 0 / 10%), 0 1px 2px -1px rgb(0 0 0 / 10%)',
    '--jsonforms-monaco-background: hsl(var(--background, 0 0% 100%))',
    '--jsonforms-monaco-foreground: hsl(var(--foreground, 222.2 84% 4.9%))',
    '--jsonforms-monaco-button-background: hsl(var(--background, 0 0% 100%))',
    '--jsonforms-monaco-button-hover-background: hsl(var(--muted, 210 40% 96.1%))',
  ].join('; ');
</script>

<MonacoControl {props} {binding} class="jsonforms-shadcn-monaco" style={monacoStyle}>
  {#snippet wrapper(errors, children)}
    <ControlWrapper {...binding.controlWrapper} {errors}>{@render children()}</ControlWrapper>
  {/snippet}
</MonacoControl>
