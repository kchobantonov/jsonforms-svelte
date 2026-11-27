<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { useEditableAdditionalProperties } from './propertyRename.svelte';
  type Model = ReturnType<typeof useEditableAdditionalProperties>;
  type Heading = Component<{ class: string; children: Snippet }>;
  const {
    model,
    controlId,
    Title,
    Description,
    errorClass,
    field,
    actions,
  }: {
    model: Pick<Model, 'rename' | 'editor'>;
    controlId: string;
    Title: Heading;
    Description: Heading;
    errorClass: string;
    field: Snippet;
    actions: Snippet;
  } = $props();
</script>

<Title class="text-lg font-semibold">{model.editor.translations.renameDialogTitle}</Title>
<Description class="mb-4">{model.editor.translations.renameDialogDescription}</Description>
<form onsubmit={model.rename.commitRename}>
  {@render field()}
  {#if model.rename.error}
    <p id={controlId + '-rename-error'} class={errorClass} role="alert">{model.rename.error}</p>
  {/if}
  <div class="mt-4 flex justify-end gap-2">{@render actions()}</div>
</form>
