<script lang="ts">
  import type { LayoutProps } from '../../src/lib/jsonFormsCompositions.svelte';
  import type { UISchemaElement } from '@jsonforms/core';
  import { useDynamicTreeResolver } from '../../src/lib/dynamicTree.svelte';
  import { useSectionIndicators } from '../../src/lib/sectionIndicators.svelte';
  import { conditionalLayout } from '../../src/lib/conditionalFields';
  import DispatchRenderer from '../../src/lib/components/DispatchRenderer.svelte';
  let props: LayoutProps = $props();
  const resolve = useDynamicTreeResolver();
  const effective = $derived(resolve(props.uischema, props.path));
  const indicators = useSectionIndicators(() => ({ uischema: props.uischema, path: props.path }));
  const filtered = $derived(
    conditionalLayout(
      effective,
      { properties: { b: { type: 'string' } } },
      new Set(['a', 'b']),
    ) as UISchemaElement & { elements: UISchemaElement[] },
  );
</script>

<div
  data-testid="tree-indicator"
  data-count={indicators.validation.count}
  data-show={indicators.validation.show}
>
  {#each filtered.elements as child, index (index)}
    <DispatchRenderer {...props} uischema={child} />
  {/each}
</div>
