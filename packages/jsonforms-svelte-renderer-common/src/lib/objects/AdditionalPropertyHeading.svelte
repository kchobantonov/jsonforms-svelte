<script lang="ts">
  import type { Component } from 'svelte';
  import type { useAdditionalPropertyErrors } from '../validation/objectErrors.svelte';
  import type { SectionIndicatorProps } from '../layout/sectionIndicators.svelte';
  import type { useJsonFormsControlWithDetail } from '../core/jsonFormsCompositions.svelte';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  const message = useRendererMessages();
  let {
    control,
    rejected,
    SectionIndicators,
  }: {
    control: ReturnType<typeof useJsonFormsControlWithDetail>['control'];
    rejected: ReturnType<typeof useAdditionalPropertyErrors>;
    SectionIndicators: Component<SectionIndicatorProps>;
  } = $props();
</script>

{#if rejected.message}
  <div class="flex items-center gap-2" data-additional-property-heading>
    <span>{message('additionalProperties.title')}</span>
    <SectionIndicators
      uischema={control.uischema}
      path={control.path}
      pathSegments={control.pathSegments}
      errorMessage={rejected.message}
      errorErrors={rejected.errors}
      errorSource="additionalProperties"
      showData={false}
    />
  </div>
{/if}
