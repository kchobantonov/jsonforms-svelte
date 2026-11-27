<script lang="ts">
  import { Collapsible } from '@skeletonlabs/skeleton-svelte';
  import { ChevronDownIcon } from '@lucide/svelte';
  import {
    MixedFrameHeader,
    type MixedFrameProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { getPortalRootNodeGetter } from '../../util';
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
  const getRootNode = getPortalRootNodeGetter();
</script>

<Collapsible
  class="items-stretch"
  {getRootNode}
  open={expanded}
  onOpenChange={(details) => onExpandedChange(details.open)}
  ids={{ content: contentId }}
>
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
  <Collapsible.Content id={contentId} hidden={!expanded} class="pt-3"
    >{@render children()}</Collapsible.Content
  >
</Collapsible>
