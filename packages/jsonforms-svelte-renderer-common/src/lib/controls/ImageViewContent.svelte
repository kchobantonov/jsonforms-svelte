<script lang="ts">
  import type { Component } from 'svelte';
  import type { Layout } from '@jsonforms/core';
  import type { RendererProps } from '../core/jsonFormsCompositions.svelte';
  import { useImageView } from './imageView.svelte';
  import { resolveImageViewStyle, type ImageViewDiagnostic } from './imageView';
  const {
    visible,
    ImageDiagnostic,
    Image,
    ...props
  }: RendererProps<Layout> & {
    visible: boolean;
    ImageDiagnostic: Component<{ diagnostic: ImageViewDiagnostic }>;
    Image?: Component<{ src: string; alt: string; style?: string; class: string }>;
  } = $props();
  const image = useImageView(props);
  const style = $derived(resolveImageViewStyle(props.uischema.options));
</script>

{#if visible}
  {#if image.src}
    {#if Image}<Image src={image.src} alt={image.alt} {style} class="h-auto max-w-full" />
    {:else}<img src={image.src} alt={image.alt} {style} class="h-auto max-w-full" />{/if}
  {/if}
  {#each image.diagnostics as diagnostic (diagnostic.code)}<ImageDiagnostic {diagnostic} />{/each}
{/if}
