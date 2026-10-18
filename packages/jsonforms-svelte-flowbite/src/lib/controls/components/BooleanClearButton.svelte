<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { CloseButton } from 'flowbite-svelte';
  let { onclick }: { onclick(): void } = $props();
  const message = useRendererMessages();
</script>

<CloseButton
  type="button"
  color="gray"
  class="size-6 shrink-0 opacity-0 transition-opacity group-focus-within/boolean:opacity-100 group-hover/boolean:opacity-100 focus-visible:opacity-100 dark:text-gray-400 [@media(hover:none)]:opacity-100"
  ariaLabel={message('control.clearValue')}
  name={message('control.clearValue')}
  title={message('control.clearValue')}
  onmousedown={(event: MouseEvent) => event.preventDefault()}
  onclick={(event: MouseEvent) => {
    // Clearing a field must not dismiss an enclosing native modal or popover.
    event.preventDefault();
    onclick();
  }}
/>
