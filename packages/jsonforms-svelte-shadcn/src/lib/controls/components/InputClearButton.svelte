<script lang="ts">
  import { XIcon } from '$lib/components/icons';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
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

<Button
  variant="ghost"
  size="icon-xs"
  class={[
    'absolute end-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100',
    multiline ? 'top-2' : 'inset-y-0 my-auto',
  ]}
  onmousedown={(event: MouseEvent) => event.preventDefault()}
  {onclick}
  {disabled}
  title={clearLabel}
  aria-label={clearLabel}
>
  <XIcon class="size-4" />
</Button>
