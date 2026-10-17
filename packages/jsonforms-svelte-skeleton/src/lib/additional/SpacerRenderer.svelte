<script lang="ts">
  import {
    useJsonFormsLayout,
    resolveSpacerSize,
    toCss,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { useSkeletonLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useSkeletonLayout(useJsonFormsLayout(props));
  const size = $derived(toCss(resolveSpacerSize(props.uischema, binding.appliedOptions)));
  const weight = $derived(props.uischema.options?.layout?.weight);
  const flexible = $derived(typeof weight === 'number' && Number.isFinite(weight) && weight > 0);
</script>

{#if binding.layout.visible}<div
    aria-hidden="true"
    data-spacer
    style:height={flexible ? undefined : size}
    style:width="100%"
    style:flex={flexible ? `${weight} 1 0` : undefined}
    style:flex-shrink={flexible ? undefined : '0'}
    style:min-width="0"
    style:min-height="0"
  ></div>{/if}
