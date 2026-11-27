<script lang="ts">
  import { useSectionPopover } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    SectionErrorSummary,
    SectionIndicatorFrame,
    useSectionStatus,
    type SectionIndicatorProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { CircleAlert } from '@lucide/svelte';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { getPortalTargetResolver, getPortalRootNodeGetter } from '../util';
  import type { HTMLAttributes } from 'svelte/elements';
  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  const props: SectionIndicatorProps = $props();
  const status = useSectionStatus(props);
  const { validationLabel } = $derived(status);
  const popup = useSectionPopover();
  const { cancelHoverClose, closeAfterHover, showOnHover, reveal, keydown } = popup;
</script>

<SectionIndicatorFrame {props} {status}>
  <Popover
    open={popup.open}
    onOpenChange={(event) => popup.setOpen(event.open)}
    {getRootNode}
    positioning={{ strategy: 'fixed' }}
  >
    <Popover.Trigger
      >{#snippet element(
        props,
      )}<!-- The native trigger snippet supports replacing its default button; its attributes target this span. -->
        <!-- The focusable status icon opens a tooltip without adding a nested button to the section header. -->
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <span
          {...props as HTMLAttributes<HTMLSpanElement>}
          role="img"
          tabindex="0"
          onclick={reveal}
          onmouseenter={showOnHover}
          onmouseleave={closeAfterHover}
          onkeydown={keydown}
          aria-label={validationLabel}
          class="text-error-500 dark:text-error-400"
          {...status.attributes}><CircleAlert size={16} aria-hidden="true" /></span
        >{/snippet}</Popover.Trigger
    >
    <Portal target={resolvePortalTarget() ?? undefined}
      ><Popover.Positioner>
        <Popover.Content
          class="card preset-filled-surface-950-50 max-w-sm p-2 text-sm whitespace-pre-line shadow-xl"
          ><div role="presentation" onmouseenter={cancelHoverClose} onmouseleave={closeAfterHover}>
            <SectionErrorSummary {status} />
          </div></Popover.Content
        >
      </Popover.Positioner></Portal
    >
  </Popover>
</SectionIndicatorFrame>
