<script lang="ts">
  import type { useColorEditor } from './colorEditor.svelte';
  const { editor, id }: { editor: ReturnType<typeof useColorEditor>; id: string } = $props();
</script>

{#if editor.transparentHex3 || editor.invalidText}
  <p id={`${id}-color-error`} role="alert">
    {editor.message(
      editor.transparentHex3 ? 'hex3Transparency' : 'invalid',
    )}{#if !editor.profile.textEntry}
      {editor.inputValue}{/if}
  </p>
{/if}
