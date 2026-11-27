<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { useFileControl } from './fileControl.svelte';
  const {
    editor,
    compact,
    emptyClass,
    attachment,
  }: {
    editor: ReturnType<typeof useFileControl>;
    compact: boolean;
    emptyClass: string;
    attachment: Snippet<[string, number, Snippet]>;
  } = $props();
</script>

{#if editor.multiple && editor.values.length}
  <ul
    class={compact
      ? 'flex max-h-8 min-w-0 flex-1 gap-1 overflow-auto'
      : 'flex max-h-32 min-w-0 flex-1 flex-wrap gap-1 overflow-auto'}
    aria-label={editor.fileMessage('file.attachments')}
  >
    {#each editor.values as value, index (index)}
      {@const name = editor.attachmentName(value, index)}
      <li class="flex max-w-full min-w-0 shrink-0">
        {#snippet filename()}
          <!-- Long filenames need keyboard focus when Remove is unavailable. -->
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <span
            class="min-w-0 truncate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
            title={name}
            tabindex="0">{name}</span
          >
        {/snippet}
        {@render attachment(name, index, filename)}
      </li>
    {/each}
  </ul>
{:else if !editor.multiple && editor.storedFileName}
  <!-- The stored filename remains focusable when Clear is unavailable. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <span
    class="min-w-0 flex-1 truncate focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
    title={editor.storedFileName}
    tabindex="0">{editor.storedFileName}</span
  >
{:else}
  <span class={emptyClass} aria-hidden="true">{editor.pickerLabel}</span>
{/if}
