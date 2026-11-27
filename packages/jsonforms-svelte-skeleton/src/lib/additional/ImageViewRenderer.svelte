<script lang="ts">
  import ImageDiagnostic from './ImageDiagnostic.svelte';
  import {
    useJsonFormsLayout,
    type RendererProps,
    ImageViewContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));
</script>

<ImageViewContent {...props} visible={binding.layout.visible} {ImageDiagnostic} />
