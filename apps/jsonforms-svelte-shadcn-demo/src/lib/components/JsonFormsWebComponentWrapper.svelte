<script lang="ts">
  import { asset } from '$app/paths';
  import type { DemoWebComponentProps } from '@chobantonov/jsonforms-svelte-demo-common';
  import { DemoWebComponent } from '@chobantonov/jsonforms-svelte-demo-common';

  const props: DemoWebComponentProps = $props();
</script>

<DemoWebComponent
  {...props}
  theme={props.theme ?? 'modern'}
  bundlePath={asset('/js/jsonforms-svelte-shadcn.js')}
  tag="jsonforms-svelte-shadcn"
/>
