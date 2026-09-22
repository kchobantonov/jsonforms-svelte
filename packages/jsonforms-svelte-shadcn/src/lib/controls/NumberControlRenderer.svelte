<script lang="ts">
  import {
    NumericValueHint,
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '$lib/components/icons';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();

  const clearValue = determineClearValue(0);

  const adaptValue = (value: any) =>
    value === '' || value === null || value === undefined ? clearValue : Number(value);
  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue);

  const incompatibleValue = $derived(
    binding.control.data !== undefined &&
      binding.control.data !== null &&
      typeof binding.control.data !== 'number',
  );
  const hintId = $derived(`${binding.control.id}-incompatible-value`);

  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'number',
      step: binding.appliedOptions.step ?? binding.control.schema.multipleOf ?? 0.1,
      min: binding.control.schema.minimum,
      max: binding.control.schema.maximum,
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
      'aria-describedby': incompatibleValue ? hintId : undefined,
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).value),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="flex min-w-0 items-center gap-1">
    <div class="group relative min-w-0 flex-1">
      <Input {...inputprops} />
      {#if binding.clearable && (incompatibleValue || (inputprops.value !== '' && inputprops.value !== undefined && inputprops.value !== null))}
        <Button
          variant="ghost"
          size="icon-xs"
          class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => binding.onChange(clearValue)}
          disabled={!binding.control.enabled}
          aria-label="Clear value"
        >
          <XIcon class="size-4" />
        </Button>
      {/if}
    </div>
    {#if incompatibleValue}<NumericValueHint id={hintId} value={binding.control.data} />{/if}
  </div>
</ControlWrapper>
