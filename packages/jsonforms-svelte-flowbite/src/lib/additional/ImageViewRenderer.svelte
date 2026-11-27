<script lang="ts">
  import ImageDiagnostic from './ImageDiagnostic.svelte';
  import {
    useJsonFormsLayout,
    type RendererProps,
    ImageViewContent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Layout } from '@jsonforms/core';
  import { useFlowbiteLayout } from '../util';
  import { Img } from 'flowbite-svelte';
  const props: RendererProps<Layout> = $props();
  const binding = useFlowbiteLayout(useJsonFormsLayout(props));
</script>

<ImageViewContent {...props} visible={binding.layout.visible} {ImageDiagnostic} Image={Img} />
