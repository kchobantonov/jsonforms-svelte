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
  const input = useFlowbiteControl(useJsonFormsControl(props), adaptValue);

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

    if (input.appliedOptions.maskReplacers) {
      tokens = toTokens(input.appliedOptions.maskReplacers);
    }
    if (input.appliedOptions.tokens) {
      tokens = toTokens(input.appliedOptions.tokens);
    }

    if (!tokens) {
      tokens = defaultTokens;
    }

    return tokens;
  });

  const returnMaskedValue = $derived.by(() => input.appliedOptions.returnMaskedValue === true);

  const tokensReplace = $derived.by(
    () => input.appliedOptions.tokensReplace !== false /* default is true*/,
  );
  const eager = $derived.by(() => input.appliedOptions.eager === false /* default is false*/);
  const reversed = $derived.by(() => input.appliedOptions.reversed === false /* default is false*/);

  const maskOptions = $derived.by<MaskInputOptions>(() => ({
    mask: input.appliedOptions.mask,
    tokens: tokens,
    tokensReplace: tokensReplace,
    reversed: reversed,
    eager: eager,
    onMaska: (detail: MaskaDetail) => (maskState = detail),
  }));

  const inputprops = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Input');

    return {
      type: 'text',
      clearableColor: 'none' as CloseButtonProps['color'],

      ...flowbiteProps,
      id: `${input.control.id}-input`,
      class: twMerge(
        input.clearable ? 'pe-9' : '',
        input.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !input.control.enabled,
      autofocus: input.appliedOptions.focus,
      placeholder: input.appliedOptions.placeholder,
      value: input.control.data,
      clearable: input.clearable,
      maxlength: input.appliedOptions.restrict ? props.schema.maxLength : undefined,
      oninput: (e: Event) => {
        let value = maskState.masked;

        if (!returnMaskedValue) {
          value = maskState.unmasked;
        }

        if (adaptValue(value) !== input.control.data) {
          input.onChange(value);
        }
      },
      clearableOnClick: () => {
        input.onChange(clearValue);
      },
      onfocus: input.handleFocus,
      onblur: input.handleBlur,
      required: input.control.required,
      'aria-invalid': !!input.control.errors,
    };
  });
</script>

<ControlWrapper {...input.controlWrapper}>
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
          disabled={!input.control.enabled}
          color={inputprops.clearableColor}
          aria-label="Clear search value"
        />
      {/if}
    {/snippet}
  </Input>
</ControlWrapper>
