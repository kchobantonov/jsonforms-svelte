<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import XIcon from '@lucide/svelte/icons/x';
  let { onclick }: { onclick(): void } = $props();
  const message = useRendererMessages();
</script>

<Button
  type="button"
  variant="ghost"
  size="icon-xs"
  class="size-6 shrink-0 opacity-0 transition-opacity group-focus-within/boolean:opacity-100 group-hover/boolean:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
  aria-label={message('control.clearValue')}
  title={message('control.clearValue')}
  onmousedown={(event) => event.preventDefault()}
  {onclick}><XIcon class="size-4" /></Button
>
