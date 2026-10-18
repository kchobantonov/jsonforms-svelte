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
  import { XIcon } from '$lib/components/icons';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Mask, type MaskInputOptions } from 'maska';
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
    mask: binding.appliedOptions.mask,
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
  <div class="group relative w-full">
    <Input {...inputprops} />
    {#if inputprops.value !== undefined && inputprops.value !== '' && binding.clearable}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        disabled={!binding.control.enabled}
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => {
          if (binding.control.enabled && !binding.control.readonly && binding.clearable)
            text.clear();
        }}
        aria-label={clearLabel}
      >
        <XIcon class="size-4" />
      </Button>
    {/if}
  </div>
</ControlWrapper>
