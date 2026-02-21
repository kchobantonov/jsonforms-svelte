<script lang="ts">
  import { useJsonFormsControl, type ControlProps } from '@chobantonov/jsonforms-svelte';
  import { CloseButton, Input, type CloseButtonProps } from 'flowbite-svelte';
  import cloneDeep from 'lodash/cloneDeep';
  import type { MaskaDetail, MaskTokens } from 'maska';
  import { type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  let maskState = $state({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const clearValue = determineClearValue('');

  const adaptValue = (value: any) => value || clearValue;
  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue);

  const defaultTokens: MaskTokens = {
    '#': { pattern: /[0-9]/ },
    '@': { pattern: /[a-zA-Z]/ },
    '*': { pattern: /[a-zA-Z0-9]/ },
  };

  const toTokens = (tokenParams: Record<string, any>): MaskTokens => {
    let tokens = cloneDeep(defaultTokens);
    if (tokenParams) {
      for (let key in tokenParams) {
        let value = tokenParams[key];

        if (value) {
          if (typeof value === 'string') {
            tokens[key] = {
              pattern: new RegExp(value),
            };
          } else {
            tokens[key] = {
              ...value,
              pattern: new RegExp(value.pattern),
            };
          }
        } else {
          delete tokens[key];
        }
      }
    }
    return tokens;
  };

  const tokens = $derived.by(() => {
    let tokens: MaskTokens | undefined = undefined;

    if (binding.appliedOptions.maskReplacers) {
      tokens = toTokens(binding.appliedOptions.maskReplacers);
    }
    if (binding.appliedOptions.tokens) {
      tokens = toTokens(binding.appliedOptions.tokens);
    }

    if (!tokens) {
      tokens = defaultTokens;
    }

    return tokens;
  });

  const returnMaskedValue = $derived.by(() => binding.appliedOptions.returnMaskedValue === true);

  const tokensReplace = $derived.by(
    () => binding.appliedOptions.tokensReplace !== false /* default is true*/,
  );
  const eager = $derived.by(() => binding.appliedOptions.eager === false /* default is false*/);
  const reversed = $derived.by(() => binding.appliedOptions.reversed === false /* default is false*/);

  const maskOptions = $derived.by<MaskInputOptions>(() => ({
    mask: binding.appliedOptions.mask,
    tokens: tokens,
    tokensReplace: tokensReplace,
    reversed: reversed,
    eager: eager,
    onMaska: (detail: MaskaDetail) => (maskState = detail),
  }));

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      type: 'text',
      clearableColor: 'none' as CloseButtonProps['color'],

      ...flowbiteProps,
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
      clearable: binding.clearable,
      maxlength: binding.appliedOptions.restrict ? props.schema.maxLength : undefined,
      oninput: (e: Event) => {
        let value = maskState.masked;

        if (!returnMaskedValue) {
          value = maskState.unmasked;
        }

        if (adaptValue(value) !== binding.control.data) {
          binding.onChange(value);
        }
      },
      clearableOnClick: () => {
        binding.onChange(clearValue);
      },
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Input {...inputprops}>
    {#snippet children(props)}
      <input
        {...props}
        value={inputprops.value}
        oninput={inputprops.oninput}
        onfocus={inputprops.onfocus}
        onblur={inputprops.onblur}
        use:maska={maskOptions}
      />
    {/snippet}
    {#snippet right()}
      {#if inputprops.value !== undefined && inputprops.value !== '' && inputprops.clearable}
        <CloseButton
          class="pointer-events-auto"
          disabled={!binding.control.enabled}
          color={inputprops.clearableColor}
          aria-label="Clear search value"
        />
      {/if}
    {/snippet}
  </Input>
</ControlWrapper>
