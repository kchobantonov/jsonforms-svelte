<script lang="ts">
  import type { Select as Primitive } from 'bits-ui';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import { getPortalTargetResolver } from '../util/inject';

  type Props = Omit<Primitive.ContentProps, 'child'> & {
    portalProps?: Omit<Primitive.PortalProps, 'children' | 'child'>;
  };
  const resolveTarget = getPortalTargetResolver();
  let { ref = $bindable(null), portalProps, class: className, ...props }: Props = $props();
  const portal = $derived(portalProps ?? { to: resolveTarget() ?? undefined });
</script>

<Select.Content
  bind:ref
  portalProps={portal}
  strategy={portal.to ? 'fixed' : 'absolute'}
  class={[
    'isolate max-h-[min(16rem,var(--bits-select-content-available-height,16rem))]',
    className,
  ]}
  {...props}
/>
