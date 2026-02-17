<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { ButtonGroup, Input, InputAddon } from 'flowbite-svelte';
  import { EyeOutline, EyeSlashOutline } from 'flowbite-svelte-icons';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');

  const input = useFlowbiteControl(useJsonFormsControl(props), (value) => value || clearValue, 300);
  let show = $state(false);

  const inputprops = $derived.by(() => {
    const flowbiteProps = input.flowbiteProps('Input');

    return {
      ...flowbiteProps,
      type: show ? 'text' : 'password',
      id: `${input.control.id}-input`,
      class: twMerge(
        'ps-9',
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
      oninput: (e: Event) => input.onChange((e.target as HTMLInputElement).value),
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
    {#snippet left()}
      <button onclick={() => (show = !show)} class="pointer-events-auto">
        {#if show}
          <EyeOutline class="h-6 w-6" />
        {:else}
          <EyeSlashOutline class="h-6 w-6" />
        {/if}
      </button>
    {/snippet}</Input
  >
</ControlWrapper>
