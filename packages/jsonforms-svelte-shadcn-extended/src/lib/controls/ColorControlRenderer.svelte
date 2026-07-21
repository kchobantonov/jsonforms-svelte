<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import {
    COLOR_MASKS,
    COLOR_MASK_TOKENS,
    toColorInputValue,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    Button,
    ControlWrapper,
    determineClearValue,
    useShadcnControl,
    XIcon,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import type { MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useShadcnControl(useJsonFormsControl(props), (value) => value || clearValue);

  const maskOptions: MaskInputOptions = {
    mask: COLOR_MASKS,
    tokens: COLOR_MASK_TOKENS,
    tokensReplace: true,
  };

  const inputValue = $derived(typeof binding.control.data === 'string' ? binding.control.data : '');
  const pickerValue = $derived(toColorInputValue(binding.control.data));

  const textInputProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        'border-input bg-background placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        binding.styles.control.input,
        shadcnProps.class,
        'ps-12',
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder ?? '#RRGGBB',
      value: inputValue,
      maxlength: 9,
      oninput: (event: Event) => binding.onChange((event.currentTarget as HTMLInputElement).value),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group relative w-full">
    <input {...textInputProps} use:maska={maskOptions} />

    <input
      id={`${binding.control.id}-picker`}
      type="color"
      value={pickerValue}
      disabled={!binding.control.enabled}
      aria-label="Choose color"
      oninput={(event) => binding.onChange((event.currentTarget as HTMLInputElement).value)}
      onfocus={binding.handleFocus}
      onblur={binding.handleBlur}
      class="border-input bg-background absolute inset-y-0 start-1 my-auto h-7 w-9 cursor-pointer rounded border p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
    />

    {#if textInputProps.value !== '' && binding.clearable}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        disabled={!binding.control.enabled}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => binding.onChange(clearValue)}
        aria-label="Clear color"
      >
        <XIcon class="size-4" />
      </Button>
    {/if}
  </div>
</ControlWrapper>
