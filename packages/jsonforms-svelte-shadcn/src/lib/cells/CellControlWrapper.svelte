<script lang="ts">
  import { CellValidationContextSymbol } from '@chobantonov/jsonforms-svelte';
  import { getContext } from 'svelte';
  import type { ControlWrapperProps } from '../util';
  const {
    id,
    visible,
    errors,
    description,
    isFocused,
    persistentHint,
    children,
  }: ControlWrapperProps = $props();
  const helpMessage = $derived(
    errors?.trim() ? errors : description && (isFocused || persistentHint) ? description : '',
  );
  const publish = getContext<((error: string) => void) | undefined>(CellValidationContextSymbol);
  $effect(() => {
    publish?.(visible ? errors : '');
    return () => publish?.('');
  });
</script>

{#if visible}
  {@render children()}
  {#if helpMessage}<span id={id + '-help'} class="sr-only">{helpMessage}</span>{/if}
{/if}
