<script lang="ts">
  import type { Snippet, Component } from 'svelte';
  import type { useNumericField } from './numeric.svelte';
  import NumericValueHint from './NumericValueHint.svelte';
  const {
    binding,
    field,
    children,
    InputClearButton,
    clearButton,
    groupClass = 'group',
  }: {
    binding: Parameters<typeof useNumericField>[0] & { clearable: boolean };
    field: ReturnType<typeof useNumericField>;
    children: Snippet;
    clearButton?: Snippet;
    InputClearButton?: Component<{ disabled: boolean; onclick(): void }>;
    groupClass?: string;
  } = $props();
</script>

<div class="flex min-w-0 items-center gap-1">
  <div class={`${groupClass} relative min-w-0 flex-1`}>
    {@render children()}
    {#if binding.clearable && (field.incompatible || field.numeric.hasValue)}
      {#if clearButton}{@render clearButton()}{:else if InputClearButton}
        <InputClearButton disabled={!binding.control.enabled} onclick={field.numeric.clear} />
      {/if}
    {/if}
  </div>
  {#if field.incompatible}<NumericValueHint id={field.hintId} value={binding.control.data} />{/if}
</div>
