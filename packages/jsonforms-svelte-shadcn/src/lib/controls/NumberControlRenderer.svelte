<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    NumericValueHint,
    useNumericInput,
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

  const binding = useShadcnControl(useJsonFormsControl(props));
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
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'number',
      step: numeric.step,
      min: numeric.minimum,
      max: numeric.maximum,
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      'aria-describedby': incompatibleValue ? hintId : undefined,
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
      <Input {...inputprops} bind:value={() => numeric.value, numeric.nativeValue} />
      {#if binding.clearable && (incompatibleValue || numeric.hasValue)}
        <Button
          variant="ghost"
          size="icon-xs"
          class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={numeric.clear}
          disabled={!binding.control.enabled}
          aria-label={message('control.clearValue')}
        >
          <XIcon class="size-4" />
        </Button>
      {/if}
    </div>
    {#if incompatibleValue}<NumericValueHint id={hintId} value={binding.control.data} />{/if}
  </div>
  {#if numeric.diagnostic}<p role="status">{numeric.diagnostic}</p>{/if}
</ControlWrapper>
