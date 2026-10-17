<script lang="ts">
  import {
    useJsonFormsControl,
    useAuthoredConfig,
    resolveRestrict,
    useRendererMessages,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  import cloneDeep from 'lodash/cloneDeep';
  import type { MaskTokenOptions } from '../util';
  import type { MaskTokens } from 'maska';
  import { Mask, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useSkeletonControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const authoredConfig = useAuthoredConfig();
  const restrict = $derived(resolveRestrict(props.uischema.options, authoredConfig.value));

  const clearValue = determineClearValue('');
  const message = useRendererMessages();
  const clearLabel = $derived(message('control.clearValue'));

  const adaptValue = (value: unknown) => value || clearValue;
  const binding = useSkeletonControl(useJsonFormsControl(props), adaptValue);

  const defaultTokens: MaskTokens = {
    '#': { pattern: /[0-9]/ },
    '@': { pattern: /[a-zA-Z]/ },
    '*': { pattern: /[a-zA-Z0-9]/ },
  };

  const toTokens = (tokenParams: MaskTokenOptions): MaskTokens => {
    let tokens = cloneDeep(defaultTokens);
    if (tokenParams) {
      for (let key in tokenParams) {
        let value = tokenParams[key];

        if (value) {
          if (typeof value === 'string') {
            tokens[key] = {
              pattern: new RegExp(value, 'u'),
            };
          } else {
            tokens[key] = {
              ...value,
              pattern:
                typeof value.pattern === 'string'
                  ? new RegExp(value.pattern, 'u')
                  : new RegExp(value.pattern),
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
  const eager = $derived.by(() => binding.appliedOptions.eager === true /* default is false*/);
  const reversed = $derived.by(
    () => binding.appliedOptions.reversed === true /* default is false*/,
  );

  const maskOptions = $derived.by<MaskInputOptions>(() => ({
    // The mask option also serves temporal controls; this adapter forwards the Maska form.
    mask: binding.appliedOptions.mask as MaskInputOptions['mask'],
    tokens: tokens,
    tokensReplace: tokensReplace,
    reversed: reversed,
    eager: eager,
  }));

  const previewMask = $derived(new Mask(maskOptions));
  const maskCompatible = $derived(
    binding.control.data === undefined ||
      binding.control.data === '' ||
      (typeof binding.control.data === 'string' &&
        (returnMaskedValue
          ? previewMask.masked(binding.control.data) === binding.control.data
          : previewMask.unmasked(binding.control.data) === binding.control.data)),
  );
  // Keep imported values visible when a mask cannot represent them losslessly.
  const applyMask = (node: HTMLInputElement, options: MaskInputOptions | undefined) => {
    let action = options ? maska(node, options) : undefined;
    return {
      update(next: MaskInputOptions | undefined) {
        if (!next) {
          action?.destroy?.();
          action = undefined;
        } else if (action) action.update?.(next);
        else action = maska(node, next);
      },
      destroy() {
        action?.destroy?.();
      },
    };
  };

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
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
      maxlength: restrict && returnMaskedValue ? binding.control.schema.maxLength : undefined,
      oninput: (event: Event) => {
        if (!binding.control.enabled) return;
        const input = event.target as HTMLInputElement;
        let value = returnMaskedValue
          ? previewMask.masked(input.value)
          : previewMask.unmasked(input.value);
        if (adaptValue(value) === binding.control.data) return;
        const maximum = binding.control.schema.maxLength;
        if (restrict && typeof maximum === 'number' && Array.from(value).length > maximum) {
          value = Array.from(value).slice(0, maximum).join('');
          input.value = returnMaskedValue ? value : previewMask.masked(value);
        }
        binding.onChange(value);
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
      use:applyMask={maskCompatible ? maskOptions : undefined}
    />
    {#if inputprops.value !== undefined && inputprops.value !== '' && binding.clearable}
      <button
        type="button"
        class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-7 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
        style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
        disabled={!binding.control.enabled}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => {
          if (binding.control.enabled) binding.onChange(clearValue);
        }}
        aria-label={clearLabel}
      >
        <XIcon class="size-4" />
      </button>
    {/if}
  </div>
</ControlWrapper>
