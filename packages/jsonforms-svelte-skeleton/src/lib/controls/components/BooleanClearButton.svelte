<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  import TupleAction from '../../components/TupleAction.svelte';
  let { onclick }: { onclick(): void } = $props();
  const message = useRendererMessages();
</script>

<TupleAction
  kind="delete"
  buttonClass="hover:preset-tonal rounded-base text-surface-600-400 inline-flex size-6 shrink-0 items-center justify-center opacity-0 transition-opacity group-focus-within/boolean:opacity-100 group-hover/boolean:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
  ariaLabel={message('control.clearValue')}
  label={message('control.clearValue')}
  onmousedown={(event) => event.preventDefault()}
  {onclick}
>
  {#snippet icon()}<XIcon class="size-4" />{/snippet}
</TupleAction>
