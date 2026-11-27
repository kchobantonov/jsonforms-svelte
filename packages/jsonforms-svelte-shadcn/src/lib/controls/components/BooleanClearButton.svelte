<script lang="ts">
  import {
    clearActionAttributes,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import XIcon from '@lucide/svelte/icons/x';
  import TupleAction from '../../components/TupleAction.svelte';
  let { onclick }: { onclick(): void } = $props();
  const message = useRendererMessages();
</script>

<TupleAction
  buttonVariant="ghost"
  buttonSize="icon-xs"
  buttonClass="size-6 shrink-0 opacity-0 transition-opacity group-focus-within/boolean:opacity-100 group-hover/boolean:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
  {...clearActionAttributes(message('control.clearValue'), onclick)}
>
  {#snippet icon()}<XIcon class="size-4" />{/snippet}
</TupleAction>
