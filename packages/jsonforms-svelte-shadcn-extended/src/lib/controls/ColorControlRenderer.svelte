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

    <div class="absolute inset-y-0 start-1 my-auto h-7 w-9" data-color-picker-wrapper>
      <input
        id={`${binding.control.id}-picker`}
        type="color"
        value={pickerValue}
        disabled={!binding.control.enabled}
        aria-label={inputValue === '' ? 'Choose color; no color selected' : 'Choose color'}
        oninput={(event) => binding.onChange((event.currentTarget as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
        class="border-input bg-background h-full w-full cursor-pointer rounded border p-0.5 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {#if inputValue === ''}
        <span
          class="color-empty-swatch border-input pointer-events-none absolute inset-0 rounded border"
          data-color-empty-swatch
          aria-hidden="true"
        >
          <svg
            class="block h-full w-full"
            viewBox="0 0 32 24"
            preserveAspectRatio="none"
            shape-rendering="crispEdges"
            data-color-empty-pattern
          >
            <rect class="color-empty-base" width="32" height="24" />
            <path
              class="color-empty-check"
              d="M0 0h8v8H0zM16 0h8v8h-8zM8 8h8v8H8zM24 8h8v8h-8zM0 16h8v8H0zM16 16h8v8h-8z"
            />
          </svg>
        </span>
      {/if}
    </div>

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

<style>
  .color-empty-swatch {
    pointer-events: none;
  }

  .color-empty-base {
    fill: hsl(var(--background, 0 0% 100%));
  }

  .color-empty-check {
    fill: hsl(var(--muted-foreground, 215.4 16.3% 46.9%));
    opacity: 0.28;
  }

  input[type='color']:focus-visible + .color-empty-swatch {
    outline: 2px solid hsl(var(--ring, 222.2 84% 4.9%));
    outline-offset: 2px;
  }
</style>
