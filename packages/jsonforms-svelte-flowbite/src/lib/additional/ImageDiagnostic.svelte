<script lang="ts">
  import { ToolbarButton, Tooltip } from 'flowbite-svelte';
  import { ExclamationCircleOutline } from 'flowbite-svelte-icons';
  import {
    ImageDiagnosticFrame,
    type ImageViewDiagnostic,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  let { diagnostic }: { diagnostic: ImageViewDiagnostic } = $props();
  let open = $state(false);
  let dismissed = $state(false);
</script>

<ImageDiagnosticFrame {diagnostic}>
  {#snippet children(warningLabel)}
    <ToolbarButton
      type="button"
      size="xs"
      aria-label={warningLabel}
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
  {/snippet}
</ImageDiagnosticFrame>
