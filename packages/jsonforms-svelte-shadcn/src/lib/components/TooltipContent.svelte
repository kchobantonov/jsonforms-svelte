<script lang="ts">
  import type { Tooltip as Primitive } from 'bits-ui';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { getPortalTargetResolver } from '../util/inject';

  type Props = Primitive.ContentProps & {
    portalProps?: Omit<Primitive.PortalProps, 'children' | 'child'>;
    arrowClasses?: string;
  };
  const resolveTarget = getPortalTargetResolver();
  let { ref = $bindable(null), portalProps, ...props }: Props = $props();
  const portal = $derived(portalProps ?? { to: resolveTarget() ?? undefined });
</script>

<Tooltip.Content
  bind:ref
  portalProps={portal}
  strategy={portal.to ? 'fixed' : 'absolute'}
  {...props}
/>
