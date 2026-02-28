<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { Input, ToolbarButton } from 'flowbite-svelte';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const adaptValue = (value: any) => value || clearValue;

  const binding = useFlowbiteControl(useJsonFormsControl(props), adaptValue, 300);
  let show = $state(false);

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      ...flowbiteProps,
      type: show ? 'text' : 'password',
      id: `${binding.control.id}-input`,
      class: twMerge(
        'ps-9',
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
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).value),
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
    {#snippet left()}
      <ToolbarButton
        color="default"
        size="xs"
        onclick={() => (show = !show)}
        aria-label={show ? 'Hide password' : 'Show password'}
        class="pointer-events-auto border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0"
      >
        {#if show}
          <EyeOutline class="h-6 w-6" />
        {:else}
          <EyeSlashOutline class="h-6 w-6" />
        {/if}
      </ToolbarButton>
    {/snippet}</Input
  >
</ControlWrapper>
