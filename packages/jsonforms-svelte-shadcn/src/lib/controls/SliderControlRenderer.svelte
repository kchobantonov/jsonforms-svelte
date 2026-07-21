<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Slider } from '$lib/components/ui/slider';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const clearValue = determineClearValue(0);
  const adaptValue = (value: any) =>
    value === '' || value === null || value === undefined ? clearValue : Number(value);
  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue);

  const resolveValue = (value: unknown, fallback: number): number => {
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const defaultValue = $derived(
    resolveValue(binding.control.schema.default, binding.control.schema.minimum ?? 0),
  );
  const effectiveValue = $derived(resolveValue(binding.control.data, defaultValue));
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="flex items-center gap-3" aria-invalid={!!binding.control.errors}>
    {#if binding.control.schema.minimum !== undefined}
      <span class="text-muted-foreground text-sm">{binding.control.schema.minimum}</span>
    {/if}
    <Slider
      type="single"
      id={`${binding.control.id}-input`}
      class="flex-1"
      showValue
      value={effectiveValue}
      min={binding.control.schema.minimum}
      max={binding.control.schema.maximum}
      step={binding.control.schema.multipleOf ?? 1}
      disabled={!binding.control.enabled}
      aria-invalid={!!binding.control.errors}
      onValueChange={(value: number) => binding.onChange(value)}
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
      {...binding.shadcnProps('Slider')}
    />
    {#if binding.control.schema.maximum !== undefined}
      <span class="text-muted-foreground text-sm">{binding.control.schema.maximum}</span>
    {/if}
  </div>
</ControlWrapper>
