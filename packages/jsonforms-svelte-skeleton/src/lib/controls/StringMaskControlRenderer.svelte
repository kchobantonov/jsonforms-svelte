<script lang="ts">
  import { useJsonFormsControl, type ControlProps } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  import cloneDeep from 'lodash/cloneDeep';
  import type { MaskaDetail, MaskTokens } from 'maska';
  import { type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  let maskState = $state({
    masked: '',
    unmasked: '',
    completed: false,
  });

  const clearValue = determineClearValue('');

  const adaptValue = (value: any) => value || clearValue;
  const binding = useSkeletonControl(useJsonFormsControl(props), adaptValue);

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
  const reversed = $derived.by(
    () => binding.appliedOptions.reversed === false /* default is false*/,
  );

  const maskOptions = $derived.by<MaskInputOptions>(() => ({
    mask: binding.appliedOptions.mask,
    tokens: tokens,
    tokensReplace: tokensReplace,
    reversed: reversed,
    eager: eager,
    onMaska: (detail: MaskaDetail) => (maskState = detail),
  }));

  const inputprops = $derived.by(() => {
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
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
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group relative w-full">
    <input
      {...inputprops}
      class={twMerge('input w-full', inputprops.class)}
      use:maska={maskOptions}
    />
    {#if inputprops.value !== undefined && inputprops.value !== '' && binding.clearable}
      <button
        type="button"
        class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
        style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
        disabled={!binding.control.enabled}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => binding.onChange(clearValue)}
        aria-label="Clear search value"
      >
        <XIcon class="size-4" />
      </button>
    {/if}
  </div>
</ControlWrapper>
