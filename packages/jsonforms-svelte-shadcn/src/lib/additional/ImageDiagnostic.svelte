<script lang="ts">
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { CircleAlert } from '@lucide/svelte';
  import { mergeProps } from 'bits-ui';
  import { getPortalTargetResolver } from '../util';
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
  const resolvePortalTarget = getPortalTargetResolver();
</script>

<div
  role="alert"
  data-image-diagnostic={diagnostic.code}
  class="my-2 flex max-w-full min-w-0 items-center gap-2 rounded border p-2 text-sm [overflow-wrap:anywhere]"
>
  <Tooltip.Provider
    ><Tooltip.Root
      bind:open={() => open && !dismissed, (value) => (open = value && !dismissed)}
      disableCloseOnTriggerClick
    >
      <Tooltip.Trigger
        >{#snippet child({ props })}
          <Button
            {...mergeProps(props, {
              onfocus: () => (dismissed = false),
              onpointerenter: () => (dismissed = false),
              onclick: () => {
                dismissed = false;
                open = true;
              },
              onkeydown: (event: KeyboardEvent) => {
                if (event.key === 'Escape') {
                  dismissed = true;
                  open = false;
                }
              },
            })}
            type="button"
            variant="ghost"
            size="icon"
            class="h-6 w-6 shrink-0"
            aria-label={message('image.warningDetails')}
          >
            <CircleAlert size={16} aria-hidden="true" />
          </Button>
        {/snippet}</Tooltip.Trigger
      >
      <Tooltip.Content
        role="tooltip"
        portalProps={{ to: resolvePortalTarget() ?? undefined }}
        class="max-w-[min(22rem,70vw)] [overflow-wrap:anywhere] whitespace-normal"
        >{diagnostic.message}</Tooltip.Content
      >
    </Tooltip.Root></Tooltip.Provider
  >
  <span data-image-summary>{summary}</span>
</div>
