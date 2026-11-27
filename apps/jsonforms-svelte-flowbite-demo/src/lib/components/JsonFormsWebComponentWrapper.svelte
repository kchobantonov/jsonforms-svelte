<script lang="ts">
  import { asset } from '$app/paths';
  import type { DemoWebComponentProps } from '@chobantonov/jsonforms-svelte-demo-common';
  import { DemoWebComponent } from '@chobantonov/jsonforms-svelte-demo-common';

  const props: Omit<DemoWebComponentProps, 'theme' | 'designSystem'> = $props();
</script>

<DemoWebComponent
  {...props}
  tag="jsonforms-svelte-flowbite"
  bundlePath={asset('/js/jsonforms-svelte-flowbite.js')}
/>
