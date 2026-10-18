<script lang="ts">
  import {
    useJsonFormsControl,
    useAuthoredConfig,
    resolveRestrict,
    useRendererMessages,
    toMaskTokens,
    useMaskedInput,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { CloseButton, Input } from 'flowbite-svelte';
  import { Mask, type MaskInputOptions } from 'maska';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const authoredConfig = useAuthoredConfig();
  const restrict = $derived(resolveRestrict(props.uischema.options, authoredConfig.value));

  const clearValue = determineClearValue('');
  const message = useRendererMessages();
  const clearLabel = $derived(message('control.clearValue'));

  const adaptValue = (value: unknown) => value || clearValue;
  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue);

  const tokenSettings = $derived.by(() => {
    let invalid = false;
    const tokens = toMaskTokens(
      binding.appliedOptions.tokens ?? binding.appliedOptions.maskReplacers,
      () => (invalid = true),
    );
    return { tokens, invalid };
  });
  const maskError = $derived(tokenSettings.invalid ? message('mask.invalidToken') : undefined);

  const returnMaskedValue = $derived.by(() => binding.appliedOptions.returnMaskedValue === true);

  const tokensReplace = $derived.by(
    () => binding.appliedOptions.tokensReplace !== false /* default is true*/,
  );
  const eager = $derived.by(() => binding.appliedOptions.eager === true /* default is false*/);
  const reversed = $derived.by(
    () => binding.appliedOptions.reversed === true /* default is false*/,
  );

  const maskOptions = $derived.by<MaskInputOptions>(() => ({
    // The mask option also serves temporal controls; this adapter forwards the Maska form.
    mask: binding.appliedOptions.mask as MaskInputOptions['mask'],
    tokens: tokenSettings.tokens,
    tokensReplace: tokensReplace,
    reversed: reversed,
    eager: eager,
  }));

  const previewMask = $derived(new Mask(maskOptions));
  const text = useMaskedInput(binding, {
    get engine() {
      return previewMask;
    },
    get returnMaskedValue() {
      return returnMaskedValue;
    },
    get restrict() {
      return restrict;
    },
  });

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      type: 'text' as const,

      ...flowbiteProps,
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
      value: text.value,
      maxlength: undefined,
      oninput: text.oninput,
      oncompositionstart: text.oncompositionstart,
      oncompositionend: text.oncompositionend,
      onfocus: binding.handleFocus,
      onblur: text.onblur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors || tokenSettings.invalid,
    };
  });
</script>

<ControlWrapper
  {...binding.controlWrapper}
  errors={[binding.controlWrapper.errors, maskError].filter(Boolean).join('\n')}
>
  <Input {...inputprops}>
    {#snippet right()}
      {#if inputprops.value !== undefined && inputprops.value !== '' && binding.clearable}
        <CloseButton
          class="pointer-events-auto"
          disabled={!binding.control.enabled}
          name={clearLabel}
          ariaLabel={clearLabel}
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={(event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            if (binding.control.enabled && !binding.control.readonly && binding.clearable)
              text.clear();
          }}
          aria-label={clearLabel}
        />
      {/if}
    {/snippet}
  </Input>
</ControlWrapper>
