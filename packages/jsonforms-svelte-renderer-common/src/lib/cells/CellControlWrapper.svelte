<script lang="ts">
  import { CellValidationContextSymbol } from '../core/types';
  import { getContext, type Snippet } from 'svelte';

  const {
    id,
    visible,
    errors,
    description,
    isFocused,
    persistentHint,
    children,
  }: {
    id: string;
    visible: boolean;
    errors: string;
    description: string;
    isFocused: boolean;
    persistentHint: boolean;
    children: Snippet;
  } = $props();
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
