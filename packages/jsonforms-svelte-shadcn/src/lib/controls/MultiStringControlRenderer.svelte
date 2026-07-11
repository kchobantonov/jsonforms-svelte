<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { XIcon } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Textarea } from '$lib/components/ui/textarea';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const adaptValue = (value: any) => value || clearValue;

  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue, 300);

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
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      maxlength: binding.appliedOptions.restrict ? props.schema.maxLength : undefined,
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).value),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group relative w-full">
    <Textarea {...inputprops} value={binding.control.data ?? ''} />
    {#if binding.clearable && binding.control.data !== '' && binding.control.data !== undefined && binding.control.data !== null}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute end-1 top-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => binding.onChange(clearValue)}
        disabled={!binding.control.enabled}
        aria-label="Clear value"
      >
        <XIcon class="size-4" />
      </Button>
    {/if}
  </div>
</ControlWrapper>
