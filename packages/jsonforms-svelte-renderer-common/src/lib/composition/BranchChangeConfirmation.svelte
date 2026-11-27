<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  const {
    Icon,
    Title,
    button,
    confirm,
    cancel,
  }: {
    Icon: Component<{ class: string }>;
    Title: Component<{ class: string; children: Snippet }>;
    button: Snippet<[boolean, string, () => void]>;
    confirm(): void;
    cancel(): void;
  } = $props();
  const message = useRendererMessages();
</script>

<div class="text-center">
  <Icon class="mx-auto mb-4 h-12 w-12 text-gray-400 dark:text-gray-200" />
  <Title class="text-lg font-semibold">{message('confirm.branchChange.title')}</Title>
  <p class="mb-5 text-center text-sm">{message('confirm.branchChange.message')}</p>
  <div class="flex justify-center gap-4">
    {@render button(false, message('confirm.decline'), cancel)}
    {@render button(true, message('confirm.accept'), confirm)}
  </div>
</div>
