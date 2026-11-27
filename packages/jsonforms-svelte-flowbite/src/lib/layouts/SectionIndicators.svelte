<script lang="ts">
  import { useSectionPopover } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    SectionErrorSummary,
    SectionIndicatorFrame,
    useSectionStatus,
    type SectionIndicatorProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ExclamationCircleOutline as CircleAlert } from 'flowbite-svelte-icons';
  import { Popover } from 'flowbite-svelte';
  const props: SectionIndicatorProps = $props();
  const status = useSectionStatus(props);
  const { validationLabel } = $derived(status);
  let trigger = $state<HTMLSpanElement>();
  const popup = useSectionPopover(() => trigger?.focus());
  const { cancelHoverClose, closeAfterHover, showOnHover, reveal, keydown } = popup;
</script>

<svelte:window
  onkeydowncapture={(event) => event.key === 'Escape' && popup.open && keydown(event)}
/>

<SectionIndicatorFrame {props} {status}>
  <!-- The focusable status icon opens a tooltip without adding a nested button to the section header. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <span
    bind:this={trigger}
    role="img"
    tabindex="0"
    onfocusin={popup.focus}
    onmouseenter={showOnHover}
    onmouseleave={closeAfterHover}
    onclick={reveal}
    onkeydown={keydown}
    aria-label={validationLabel}
    class="text-red-500 dark:text-red-400"
    {...status.attributes}><CircleAlert size="sm" aria-hidden="true" /></span
  >
  <Popover
    bind:isOpen={() => popup.open && !popup.dismissed, popup.setOpen}
    trigger="click"
    transitionParams={{ duration: 0 }}
    strategy="fixed"
    role="dialog"
    class="m-0 w-max max-w-sm whitespace-pre-line"
    ><div role="presentation" onmouseenter={cancelHoverClose} onmouseleave={closeAfterHover}>
      <SectionErrorSummary {status} />
    </div></Popover
  >
</SectionIndicatorFrame>
