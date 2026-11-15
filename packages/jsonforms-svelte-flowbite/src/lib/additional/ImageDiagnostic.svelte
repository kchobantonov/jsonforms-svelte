<script lang="ts">
  import { ToolbarButton, Tooltip } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import { useRendererMessages, type ImageViewDiagnostic } from '@chobantonov/jsonforms-svelte';
  let { diagnostic }: { diagnostic: ImageViewDiagnostic } = $props();
  const message = useRendererMessages();
  const summary = $derived(
    message(
      diagnostic.code === 'image.urlRefused' ? 'image.blocked' : 'image.configurationWarning',
    ),
  );
  let open = $state(false);
  let dismissed = $state(false);
</script>

<div
  role="alert"
  data-image-diagnostic={diagnostic.code}
  class="my-2 flex max-w-full min-w-0 items-center gap-2 rounded border p-2 text-sm [overflow-wrap:anywhere]"
>
  <ToolbarButton
    type="button"
    size="xs"
    aria-label={message('image.warningDetails')}
    onfocusout={() => (dismissed = false)}
    onmouseleave={() => (dismissed = false)}
    onclick={() => {
      dismissed = false;
      open = true;
    }}
    onkeydown={(event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        dismissed = true;
        open = false;
      }
    }}
  >
    <ExclamationCircleOutline class="h-4 w-4" aria-hidden="true" />
  </ToolbarButton>
  <Tooltip
    bind:isOpen={() => open && !dismissed, (value) => (open = value && !dismissed)}
    triggerDelay={0}
    transitionParams={{ duration: 0 }}
    strategy="fixed"
    class="max-w-[min(22rem,70vw)] [overflow-wrap:anywhere] whitespace-normal"
    >{diagnostic.message}</Tooltip
  >
  <span data-image-summary>{summary}</span>
</div>
