<script lang="ts">
  import { XIcon } from '@lucide/svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  const {
    label,
    disabled,
    multiline = false,
    onclick,
  }: {
    label?: string;
    disabled: boolean;
    multiline?: boolean;
    onclick(): void;
  } = $props();
  const clearLabel = $derived(label ?? message('control.clearValue'));
</script>

<button
  type="button"
  class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
  style={multiline
    ? 'position: absolute; inset-inline-end: 0.25rem; inset-block-start: 0.75rem;'
    : 'position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;'}
  onmousedown={(event: MouseEvent) => event.preventDefault()}
  {onclick}
  {disabled}
  title={clearLabel}
  aria-label={clearLabel}
>
  <XIcon class="size-4" />
</button>
