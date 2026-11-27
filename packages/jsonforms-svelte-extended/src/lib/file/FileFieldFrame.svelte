<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { useFilePickerField } from './fileControl.svelte';
  const {
    field,
    compact,
    invalid,
    class: className,
    FileOperationFeedback,
    children,
    nativeInputProps,
  }: {
    field: ReturnType<typeof useFilePickerField>;
    compact: boolean;
    invalid: boolean;
    class: string;
    FileOperationFeedback: Component<{
      message: string;
      severity: 'warning' | 'error';
      compact: boolean;
      id?: string;
    }>;
    children: Snippet;
    nativeInputProps?: Record<string, unknown>;
  } = $props();
</script>

{#snippet feedback()}
  {#if field.feedback}<FileOperationFeedback {...field.feedback} {compact} />{/if}
{/snippet}
<div data-file-control data-invalid={invalid || undefined} class={className}>
  {#if nativeInputProps}
    <div hidden>
      <input
        {...nativeInputProps}
        {...field.nativeInput}
        aria-invalid={invalid}
        bind:this={field.editor.fileInput}
      />
    </div>
  {/if}
  {@render children()}
  {#if compact}{@render feedback()}{/if}
</div>
{#if !compact}{@render feedback()}{/if}
