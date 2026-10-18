<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  let { onclick }: { onclick(): void } = $props();
  const message = useRendererMessages();
</script>

<button
  type="button"
  class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex size-6 shrink-0 items-center justify-center opacity-0 transition-opacity group-focus-within/boolean:opacity-100 group-hover/boolean:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
  aria-label={message('control.clearValue')}
  title={message('control.clearValue')}
  onmousedown={(event) => event.preventDefault()}
  {onclick}><XIcon class="size-4" /></button
>
