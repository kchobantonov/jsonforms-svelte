<script lang="ts">
  import type { Popover as Primitive } from 'bits-ui';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { getPortalTargetResolver } from '../util/inject';

  type Props = Primitive.ContentProps & {
    portalProps?: Omit<Primitive.PortalProps, 'children' | 'child'>;
  };
  const resolveTarget = getPortalTargetResolver();
  let { ref = $bindable(null), portalProps, ...props }: Props = $props();
  const portal = $derived(portalProps ?? { to: resolveTarget() ?? undefined });
</script>

<Popover.Content
  bind:ref
  portalProps={portal}
  strategy={portal.to ? 'fixed' : 'absolute'}
  {...props}
/>
