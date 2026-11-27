<script lang="ts">
  import { asset } from '$app/paths';
  import type { DemoWebComponentProps } from '@chobantonov/jsonforms-svelte-demo-common';
  import { DemoWebComponent } from '@chobantonov/jsonforms-svelte-demo-common';

  const props: Omit<DemoWebComponentProps, 'designSystem'> = $props();
</script>

<DemoWebComponent
  {...props}
  theme={props.theme ?? 'modern'}
  tag="jsonforms-svelte-skeleton"
  bundlePath={asset('/js/jsonforms-svelte-skeleton.js')}
/>
