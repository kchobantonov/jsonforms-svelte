<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { ErrorObject } from 'ajv';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  const {
    index,
    hidden,
    errors,
    ValidationBadge,
    ValidationIcon,
    children,
  }: {
    index: number;
    hidden?: unknown;
    errors: ErrorObject[];
    ValidationBadge: Component<{
      errors: ErrorObject[];
      border: boolean;
      children: Snippet;
      'data-list-item-errors': boolean;
    }>;
    ValidationIcon: Component<{ errors: ErrorObject[]; 'data-list-item-errors': boolean }>;
    children: Snippet;
  } = $props();
  const message = useRendererMessages();
</script>

{#if hidden}
  <ValidationIcon data-list-item-errors {errors} />
  <span class="sr-only">{message('array.indexLabel')} {index + 1}:</span>
{:else}
  <div data-list-avatar class="relative shrink-0">
    <ValidationBadge data-list-item-errors border {errors}>{@render children()}</ValidationBadge>
  </div>
{/if}
