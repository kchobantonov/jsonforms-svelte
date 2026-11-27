<script lang="ts">
  import * as Collapsible from '@jsonforms-svelte-shadcn-ui/collapsible';
  import { ChevronDownIcon } from '$lib/components/icons';
  import {
    MixedFrameHeader,
    type MixedFrameProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  let {
    expanded,
    collapsible,
    label,
    selector,
    indicator,
    children,
    onExpandedChange,
  }: MixedFrameProps = $props();
  const contentId = $props.id();
</script>

<Collapsible.Root open={expanded} onOpenChange={onExpandedChange}>
  <MixedFrameHeader
    {selector}
    {indicator}
    {label}
    {collapsible}
    {expanded}
    {contentId}
    Trigger={Collapsible.Trigger}
    Chevron={ChevronDownIcon}
  />
  <Collapsible.Content
    id={contentId}
    forceMount
    hiddenUntilFound={false}
    hidden={!expanded}
    class="pt-3">{@render children()}</Collapsible.Content
  >
</Collapsible.Root>
