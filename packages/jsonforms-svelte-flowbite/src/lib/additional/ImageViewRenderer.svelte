<script lang="ts">
  import ImageDiagnostic from './ImageDiagnostic.svelte';
  import {
    useJsonFormsLayout,
    useImageView,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useFlowbiteLayout } from '../util';
  import { Img } from 'flowbite-svelte';
  const props: RendererProps<Layout> = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
  const image = useImageView(props);
</script>

{#if binding.layout.visible}
  {#if image.src}<Img src={image.src} alt={image.alt} class="h-auto max-w-full" />{/if}
  {#each image.diagnostics as diagnostic (diagnostic.code)}
    <ImageDiagnostic {diagnostic} />
  {/each}
{/if}
