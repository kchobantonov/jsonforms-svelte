<script lang="ts">
  import { useTextInput } from '@chobantonov/jsonforms-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '$lib/components/icons';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Textarea } from '@jsonforms-svelte-shadcn-ui/textarea';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const adaptValue = (value: any) => value || clearValue;

  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue);
  const text = useTextInput(binding);

  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('textarea');

    return {
      ...shadcnProps,
      id: `${binding.control.id}-input`,
      class: twMerge(
        'w-full',
        binding.styles.control.input,
        shadcnProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      maxlength: undefined,
      oncompositionstart: text.oncompositionstart,
      oncompositionend: text.oncompositionend,
      oninput: text.oninput,
      onfocus: binding.handleFocus,
      onblur: text.onblur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group relative w-full">
    <Textarea {...inputprops} value={text.value} />
    {#if binding.clearable && text.value !== '' && text.value !== undefined && text.value !== null}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute end-1 top-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => text.clear()}
        disabled={!binding.control.enabled}
        aria-label={message('control.clearValue')}
      >
        <XIcon class="size-4" />
      </Button>
    {/if}
  </div>
</ControlWrapper>
