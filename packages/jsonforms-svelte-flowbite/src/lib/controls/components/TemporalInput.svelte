<script lang="ts">
  import { adornedInputAttributes } from '../../util';
  import { TemporalNotice } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { Snippet } from 'svelte';
  import {
    controlHelpVisible,
    joinDescriptionIds,
    useRendererMessages,
    type useJsonFormsControl,
    type useTemporalEditor,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    CloseButton,
    getTheme,
    Input,
    input as inputTheme,
    type CloseButtonProps,
  } from 'flowbite-svelte';
  import { maska } from 'maska/svelte';
  import { twMerge } from 'tailwind-merge';
  import clsx from 'clsx';
  import type { useFlowbiteControl } from '../../util';

  type InputBinding = ReturnType<typeof useJsonFormsControl>;
  const {
    binding,
    editor,
    rangeError,
    left,
  }: {
    binding: ReturnType<typeof useFlowbiteControl<InputBinding['control'], InputBinding>>;
    editor: ReturnType<typeof useTemporalEditor>;
    rangeError?: boolean;
    left: Snippet;
  } = $props();
  const message = useRendererMessages();
  const inputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');
    const helpVisible = controlHelpVisible(binding);

    return {
      clearableColor: 'none' as CloseButtonProps['color'],

      ...flowbiteProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.initialFocus,
      placeholder: binding.appliedOptions.placeholder ?? editor.displayFormat,
      value: editor.inputValue,
      clearable: binding.clearable,
      oninput: (e: Event) => editor.handleInputChange((e.target as HTMLInputElement).value),
      clearableOnClick: () => {
        editor.handleInputChange(null);
      },
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
      'aria-describedby': joinDescriptionIds(
        flowbiteProps['aria-describedby'],
        helpVisible ? `${binding.control.id}-help` : undefined,
        editor.hasDraft ? `${binding.control.id}-draft-hint` : undefined,
        rangeError ? `${binding.control.id}-draft-range` : undefined,
      ),
    };
  });

  const theme = $derived(getTheme('input'));

  const { close } = $derived(inputTheme());
</script>

<div class="group/clear relative w-full">
  <Input {...inputProps} {left}>
    {#snippet children(props)}
      <input {...adornedInputAttributes(props, inputProps)} use:maska={editor.maskOptions} />
      {#if inputProps.value !== undefined && inputProps.value !== '' && inputProps.clearable}
        <CloseButton
          class={twMerge(
            close({ class: clsx(theme?.close) }),
            'invisible group-focus-within/clear:visible group-hover/clear:visible focus-visible:visible',
          )}
          disabled={!binding.control.enabled || binding.control.readonly}
          color={inputProps.clearableColor}
          title={message('control.clearValue')}
          ariaLabel={message('control.clearValue')}
          name={message('control.clearValue')}
        />
      {/if}
    {/snippet}
  </Input>
</div>
<TemporalNotice
  controlId={binding.control.id}
  kind="hint"
  text={editor.draftHint}
  class="text-xs text-gray-500 dark:text-gray-400"
/>
