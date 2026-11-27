<script lang="ts">
  import ImageDiagnostic from './ImageDiagnostic.svelte';
  import {
    useJsonFormsLayout,
    type RendererProps,
    ImageViewContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import { useShadcnLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsLayout(props));
</script>

<ImageViewContent {...props} visible={binding.layout.visible} {ImageDiagnostic} />
