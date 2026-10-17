<script lang="ts">
  import type { RendererProps } from '../../src/lib/jsonFormsCompositions.svelte';
  import { useSectionIndicators } from '../../src/lib/sectionIndicators.svelte';
  const props: RendererProps = $props();
  const indicators = useSectionIndicators(() => ({
    uischema: props.uischema,
    path: props.uischema.options?.contextPath ?? props.path,
  }));
</script>

<output data-testid="count">{indicators.validation.show ? indicators.validation.count : 0}</output>
<output data-testid="data">{indicators.hasData}</output>
