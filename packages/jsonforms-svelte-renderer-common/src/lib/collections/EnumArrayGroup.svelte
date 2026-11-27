<script lang="ts">
  import type { Snippet } from 'svelte';
  import type {
    ControlProps,
    useJsonFormsMultiEnumControl,
  } from '../core/jsonFormsCompositions.svelte';
  import { useAuthoredConfig } from '../core/jsonFormsCompositions.svelte';
  import { resolveRestrict } from '../core/options';
  import {
    enumChoices,
    enumChoicesWithImportedValues,
    enumChoiceDisabled,
    hasEnumValue,
  } from '../controls/enumChoices';
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  const {
    props,
    binding,
    item,
  }: {
    props: ControlProps;
    binding: ReturnType<typeof useJsonFormsMultiEnumControl> & {
      handleFocus(): void;
      handleBlur(): void;
    };
    item: Snippet<[string, string, () => boolean, boolean, (checked: boolean) => void]>;
  } = $props();
  const authoredConfig = useAuthoredConfig();
  const restrict = $derived(resolveRestrict(props.uischema.options, authoredConfig.value));

  const message = useRendererMessages();
  const vertical = $derived(props.uischema.options?.vertical === true);
  const choices = $derived(
    enumChoices(enumChoicesWithImportedValues(binding.control.options, binding.control.data)),
  );

  function disabled(value: unknown): boolean {
    return (
      !binding.control.enabled ||
      !binding.control.visible ||
      binding.control.readonly ||
      enumChoiceDisabled(binding.control.data, value, binding.control.schema, restrict)
    );
  }
  function toggle(value: unknown, checked: boolean) {
    if (disabled(value) || checked === dataHasEnum(value)) return;
    if (checked) {
      if (!(binding.control.options ?? []).some((option) => hasEnumValue([option.value], value)))
        return;
      binding.addItem(binding.control.path, value);
    } else binding.removeItem?.(binding.control.path, value);
  }

  function dataHasEnum(value: unknown): boolean {
    return hasEnumValue(binding.control.data, value);
  }
</script>

<div
  role="group"
  aria-label={binding.control.label}
  aria-describedby={binding.control.required ? `${binding.control.id}-required` : undefined}
  onfocusin={binding.handleFocus}
  onfocusout={binding.handleBlur}
  class={`flex gap-2 ${vertical ? 'flex-col' : 'flex-row flex-wrap'}`}
>
  {#if binding.control.required}<span id={`${binding.control.id}-required`} class="sr-only"
      >{message('control.required')}</span
    >{/if}
  {#each choices as option (option.id)}
    {@render item(
      `${binding.control.id}-${option.id}`,
      option.label,
      () => dataHasEnum(option.value),
      disabled(option.value),
      (checked) => toggle(option.value, checked),
    )}
  {/each}
</div>
