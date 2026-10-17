<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    NumericValueHint,
    useNumericInput,
    useTranslator,
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte';
  import { Input, Button } from 'flowbite-svelte';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const t = useTranslator();

  const clearValue = determineClearValue(0);

  const binding = useFlowbiteControl(useJsonFormsControl(props));
  const numeric = useNumericInput(
    {
      get data() {
        return binding.control.data;
      },
      get path() {
        return binding.control.path;
      },
      get schema() {
        return binding.control.schema;
      },
      get options() {
        return binding.appliedOptions;
      },
      get enabled() {
        return binding.control.enabled && !binding.control.readonly;
      },
      clearValue,
      onChange: binding.onChange,
    },
    false,
  );

  const incompatibleValue = $derived(
    binding.control.data !== undefined &&
      binding.control.data !== null &&
      typeof binding.control.data !== 'number',
  );
  const hintId = $derived(`${binding.control.id}-incompatible-value`);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      ...flowbiteProps,

      type: 'number',
      step: numeric.step,
      min: numeric.minimum,
      max: numeric.maximum,
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      'aria-describedby': incompatibleValue ? hintId : undefined,
      clearable: binding.clearable && !incompatibleValue,
      oninput: numeric.input,
      onfocus: binding.handleFocus,
      onblur: () => {
        numeric.blur();
        binding.handleBlur();
      },
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors || !!numeric.error,
    };
  });
</script>

<ControlWrapper
  {...binding.controlWrapper}
  errors={[binding.controlWrapper.errors, numeric.error].filter(Boolean).join('\n')}
>
  <div class="flex min-w-0 items-center gap-1">
    <div class="group relative min-w-0 flex-1">
      <!-- Flowbite excludes null from InputValue, but Svelte emits null for incomplete numeric input. -->
      <Input
        {...inputprops}
        bind:value={() => numeric.value as string | number | undefined, numeric.nativeValue}
        clearable={false}
      />
      {#if binding.clearable && (incompatibleValue || numeric.hasValue)}
        <Button
          size="xs"
          class="absolute inset-y-0 end-1 my-auto h-6 w-6 p-0"
          disabled={!binding.control.enabled}
          onclick={numeric.clear}
          aria-label={t.value('numeric.clearValue', message('control.clearValue'))}>×</Button
        >
      {/if}
    </div>
    {#if incompatibleValue}<NumericValueHint id={hintId} value={binding.control.data} />{/if}
  </div>
  {#if numeric.diagnostic}<p role="status">{numeric.diagnostic}</p>{/if}
</ControlWrapper>
