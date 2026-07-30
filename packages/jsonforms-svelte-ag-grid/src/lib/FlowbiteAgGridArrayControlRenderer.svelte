<script lang="ts">
  import type { RendererProps } from '@chobantonov/jsonforms-svelte';
  import type { ControlElement } from '@jsonforms/core';
  import LazyRenderer from './LazyAgGridArrayControlRenderer.svelte';

  const props: RendererProps<ControlElement> = $props();
</script>

<LazyRenderer {...props} appearance="flowbite" />
