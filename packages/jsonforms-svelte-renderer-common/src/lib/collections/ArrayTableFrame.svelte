<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { useArrayTable } from './arrayTable.svelte';
  import { arrayChildNotice } from './arrayChildNotice';
  let {
    binding,
    table,
    ConfirmationDialog,
    errorClass,
    children,
    noticeElement = $bindable(),
  }: {
    binding: Parameters<typeof useArrayTable>[1];
    table: ReturnType<typeof useArrayTable>;
    ConfirmationDialog: Component<{
      operation: 'delete';
      title: string;
      description: string;
      acceptLabel: string;
      onAccept(): void;
      onCancel(): void;
    }>;
    errorClass: string;
    children: Snippet;
    noticeElement?: HTMLParagraphElement;
  } = $props();
  const { deletion, message, revealFirstError } = $derived(table);
  const { childErrorCount, firstInvalidIndex } = $derived(table);
</script>

{#if binding.control.visible}
  {#if binding.control.errors}
    <p role="alert" data-array-own-errors class={errorClass}>
      {binding.control.errors}
    </p>
  {/if}
  {#if childErrorCount > 0 && !binding.appliedOptions.hideArraySummaryValidation && binding.appliedOptions.showValidationIndicator !== false && binding.appliedOptions.showValidationIndicator !== true}
    <p bind:this={noticeElement} role="alert" data-array-summary class={errorClass}>
      <span data-array-summary-message
        >{arrayChildNotice(
          childErrorCount,
          binding.appliedOptions.showValidationIndicatorCount === true,
          message,
        )}</span
      >
      {#if firstInvalidIndex !== undefined}
        <button
          type="button"
          class="ms-2 underline"
          onclick={() => revealFirstError(() => noticeElement)}
          >{message('collection.firstError')}</button
        >
      {/if}
    </p>
  {/if}
  {@render children()}
{/if}

{#if deletion.pending && binding.control.visible}
  <ConfirmationDialog
    operation="delete"
    title={message('collection.deleteSelected')}
    description={message('collection.deleteSelectedMessage')}
    acceptLabel={message('collection.deleteSelected')}
    onAccept={deletion.accept}
    onCancel={deletion.cancel}
  />
{/if}
