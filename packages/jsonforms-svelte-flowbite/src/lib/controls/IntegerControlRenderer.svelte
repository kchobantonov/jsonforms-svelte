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
  import { Input, CloseButton } from 'flowbite-svelte';
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
      get step() {
        return binding.control.uischema.options?.step;
      },
      get enabled() {
        return binding.control.enabled && !binding.control.readonly;
      },
      clearValue,
      onChange: binding.onChange,
    },
    true,
  );

  const incompatibleValue = $derived(
    binding.control.data !== undefined &&
      binding.control.data !== null &&
      typeof binding.control.data !== 'number',
  );
  const hintId = $derived(`${binding.control.id}-incompatible-value`);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!binding.controlWrapper.errors?.trim() ||
        !!numeric.error?.trim() ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));
    const describedBy = [
      flowbiteProps['aria-describedby'],
      incompatibleValue ? hintId : undefined,
      helpVisible ? `${binding.control.id}-help` : undefined,
    ]
      .filter((value): value is string => typeof value === 'string' && value.length > 0)
      .join(' ');

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
      autofocus: binding.initialFocus,
      placeholder: binding.appliedOptions.placeholder,
      'aria-describedby': describedBy || undefined,
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
    <div class="group/clear relative min-w-0 flex-1">
      <!-- Flowbite excludes null from InputValue, but Svelte emits null for incomplete numeric input. -->
      <Input
        {...inputprops}
        bind:value={() => numeric.value as string | number | undefined, numeric.nativeValue}
        clearable={false}
      />
      {#if binding.clearable && (incompatibleValue || numeric.hasValue)}
        <CloseButton
          color="none"
          class="invisible absolute end-1 top-1/2 -translate-y-1/2 group-focus-within/clear:visible group-hover/clear:visible focus-visible:visible"
          disabled={!binding.control.enabled || binding.control.readonly}
          name={t.value('numeric.clearValue', message('control.clearValue'))}
          title={t.value('numeric.clearValue', message('control.clearValue'))}
          ariaLabel={t.value('numeric.clearValue', message('control.clearValue'))}
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={(event: MouseEvent) => {
            event.preventDefault();
            numeric.clear();
          }}
        />
      {/if}
    </div>
    {#if incompatibleValue}<NumericValueHint id={hintId} value={binding.control.data} />{/if}
  </div>
</ControlWrapper>
