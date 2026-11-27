<script lang="ts">
  import type { RendererProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { MarkupLabelRenderer as SharedMarkupLabelRenderer } from '@chobantonov/jsonforms-svelte-extended';
  import type { LabelElement } from '@jsonforms/core';
  import MarkupLabelTypography from './MarkupLabelTypography.svelte';

  const props: RendererProps<LabelElement> = $props();
</script>

<SharedMarkupLabelRenderer {...props} typographyComponent={MarkupLabelTypography} />
