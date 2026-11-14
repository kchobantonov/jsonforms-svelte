<script lang="ts">
  import { getContext } from 'svelte';
  import { DispatchRenderer, useUIDiagnosticReporter } from '@chobantonov/jsonforms-svelte';
  import {
    nativeTemplateSlotContext,
    type NativeTemplateSlotContext,
    type NativeTemplateSlotProps,
  } from '../core/nativeTemplate';
  const {
    name,
    children,
    onmissing,
  }: NativeTemplateSlotProps & { onmissing?: (missing: boolean) => void } = $props();
  const context = getContext<NativeTemplateSlotContext>(nativeTemplateSlotContext);
  const reportDiagnostic = useUIDiagnosticReporter();
  const element = $derived(
    Object.hasOwn(context.elements, name) ? context.elements[name] : undefined,
  );
  let reportedMissing: string | undefined;
  $effect(() => {
    onmissing?.(!element);
    const key = !element ? JSON.stringify([context.path, name]) : undefined;
    if (key === reportedMissing) return;
    reportedMissing = key;
    if (!element)
      reportDiagnostic('template.unknownSlot', {
        severity: 'warning',
        message: 'The native template requested a slot with no matching child.',
        path: context.path,
        details: { name },
      });
  });
</script>

{#if element}
  <DispatchRenderer
    schema={context.schema}
    uischema={element}
    path={context.path}
    enabled={context.enabled}
    renderers={context.renderers}
    cells={context.cells}
  />
{:else}
  {@render children?.()}
{/if}
