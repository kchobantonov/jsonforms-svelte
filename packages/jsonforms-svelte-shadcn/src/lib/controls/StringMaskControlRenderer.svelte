<script lang="ts">
  import { createAttachmentKey, fromAction } from 'svelte/attachments';
  import {
    useJsonFormsControl,
    useAuthoredConfig,
    resolveRestrict,
    useRendererMessages,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '$lib/components/icons';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import cloneDeep from 'lodash/cloneDeep';
  import type { MaskTokens } from 'maska';
  import { Mask, type MaskInputOptions } from 'maska';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();
  const authoredConfig = useAuthoredConfig();
  const restrict = $derived(resolveRestrict(props.uischema.options, authoredConfig.value));

  const clearValue = determineClearValue('');
  const message = useRendererMessages();
  const clearLabel = $derived(message('control.clearValue'));

  const adaptValue = (value: any) => value || clearValue;
  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue);

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
    mask: binding.appliedOptions.mask,
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
  const maskAttachment = {
    [createAttachmentKey()]: fromAction(applyMask, () =>
      maskCompatible ? maskOptions : undefined,
    ),
  };

  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'text' as const,
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
    <Input {...inputprops} {...maskAttachment} />
    {#if inputprops.value !== undefined && inputprops.value !== '' && binding.clearable}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        disabled={!binding.control.enabled}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => {
          if (binding.control.enabled) binding.onChange(clearValue);
        }}
        aria-label={clearLabel}
      >
        <XIcon class="size-4" />
      </Button>
    {/if}
  </div>
</ControlWrapper>
