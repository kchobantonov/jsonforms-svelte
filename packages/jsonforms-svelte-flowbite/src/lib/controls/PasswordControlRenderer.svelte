<script lang="ts">
  import {
    type ControlProps,
    usePasswordField,
    PasswordSegments,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Input, CloseButton } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import PasswordToggle from './components/PasswordToggle.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const { binding } = useFlowbiteTextControl(props, clearValue);
  const field = usePasswordField(binding);
  const { password, text } = field;

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');
    return {
      ...flowbiteProps,
      ...field.inputAttributes(flowbiteProps['aria-describedby']),
      class: twMerge(
        'ps-9',
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      clearable: false,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  {#if password.segmented}
    <div class="group/otp flex min-w-0 items-center gap-2">
      <PasswordSegments {...field.segmentAttributes(inputprops['aria-describedby'])}>
        {#snippet input(attributes)}
          <div class="w-10 min-w-6 shrink">
            <Input {...attributes} class="px-1 text-center" />
          </div>
        {/snippet}
      </PasswordSegments>
      <PasswordToggle {...field.toggleProps} />
      {#if binding.clearable && binding.control.data}
        <CloseButton
          name={password.clearLabel}
          class="invisible group-focus-within/otp:visible group-hover/otp:visible"
          title={password.clearLabel}
          ariaLabel={password.clearLabel}
          disabled={!binding.control.enabled}
          onclick={(event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            field.clearSegments(clearValue);
          }}
        />
      {/if}
    </div>
  {:else}
    <div class="group/clear w-full">
      <Input {...inputprops}>
        {#snippet left()}
          <PasswordToggle
            {...field.toggleProps}
            class="pointer-events-auto border-0 bg-transparent p-0 hover:bg-transparent focus:ring-0"
          />
        {/snippet}
        {#snippet right()}
          {#if field.showClear}
            <CloseButton
              name={password.clearLabel}
              title={password.clearLabel}
              ariaLabel={password.clearLabel}
              size="sm"
              disabled={!binding.control.enabled}
              class="pointer-events-auto invisible group-focus-within/clear:visible group-hover/clear:visible focus-visible:visible"
              onmousedown={(event: MouseEvent) => event.preventDefault()}
              onclick={(event: MouseEvent) => {
                event.preventDefault();
                event.stopPropagation();
                text.clear();
              }}
            />
          {/if}
        {/snippet}
      </Input>
    </div>
  {/if}
</ControlWrapper>
