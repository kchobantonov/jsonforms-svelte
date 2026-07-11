<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const adaptValue = (value: any) => value || clearValue;

  // Suggestions for combobox/select
  const suggestions = $derived.by(() => {
    const sug = props.uischema.options?.suggestion;
    if (sug === undefined || !Array.isArray(sug) || !sug.every((s) => typeof s === 'string')) {
      return undefined;
    }
    return sug as string[];
  });

  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue, 300);
  const datalistId = $derived.by(() =>
    suggestions && suggestions.length > 0 ? `${binding.control.id}-suggestions` : undefined,
  );

  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'text',
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
      maxlength: binding.appliedOptions.restrict ? props.schema.maxLength : undefined,
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).value),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group relative w-full">
    <Input {...inputprops} list={datalistId} />
    {#if binding.clearable && inputprops.value !== '' && inputprops.value !== undefined && inputprops.value !== null}
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
    {#if datalistId}
      <datalist id={datalistId}>
        {#each suggestions ?? [] as suggestion (suggestion)}
          <option value={suggestion}></option>
        {/each}
      </datalist>
    {/if}
  </div>
</ControlWrapper>
