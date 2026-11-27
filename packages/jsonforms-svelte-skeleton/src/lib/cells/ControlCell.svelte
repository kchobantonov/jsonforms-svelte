<script lang="ts">
  import { RendererCell, type ControlProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ControlWrapperSymbol } from '../util';
  import CellContent from './CellContent.svelte';
  import type { Component } from 'svelte';
  const { renderer, ...props }: ControlProps & { renderer: Component<ControlProps> } = $props();
</script>

<RendererCell {...props} wrapperKey={ControlWrapperSymbol} content={CellContent} {renderer} />
