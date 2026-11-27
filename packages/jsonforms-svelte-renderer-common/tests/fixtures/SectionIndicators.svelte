<script lang="ts">
  import type { RendererProps } from '../../src/lib/index.js';
  import { useSectionIndicators } from '../../src/lib/layout/sectionIndicators.svelte.ts';
  const props: RendererProps = $props();
  const indicators = useSectionIndicators(() => ({
    uischema: props.uischema,
    path: props.uischema.options?.contextPath ?? props.path,
    pathSegments: props.uischema.options?.contextSegments as readonly string[] | undefined,
  }));
</script>

<output data-testid="count">{indicators.validation.show ? indicators.validation.count : 0}</output>
<output data-testid="data">{indicators.hasData}</output>
