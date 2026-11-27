<script lang="ts">
  import { textInputAttributes } from '@chobantonov/jsonforms-svelte-renderer-common';

  import {
    useSuggestedTextInput,
    type ControlProps,
    useRendererMessages,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Input, CloseButton } from 'flowbite-svelte';
  const message = useRendererMessages();
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useFlowbiteTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import MultiStringControlRenderer from './MultiStringControlRenderer.svelte';

  const { schemaSuggestions, ...props }: ControlProps & { schemaSuggestions: boolean } = $props();

  let inputElement = $state<HTMLInputElement>();
  const clearValue = determineClearValue('');
  const { binding } = useFlowbiteTextControl(props, clearValue);

  const field = useSuggestedTextInput(binding, () => schemaSuggestions);
  const { text } = field;

  const inputprops = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');
    return {
      type: 'text',
      ...flowbiteProps,

      data: field.suggestions,
      ...textInputAttributes(binding, text, flowbiteProps['aria-describedby']),
      maxlength: undefined,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      value: text.value,
      clearable: binding.clearable,
      onSelect: (item: string) => text.change(item),
      clearableOnClick: () => {
        text.clear();
      },
    };
  });
</script>

{#if !schemaSuggestions && binding.appliedOptions.multi === true}
  <MultiStringControlRenderer {...props} />
{:else}
  <ControlWrapper {...binding.controlWrapper}>
    <div class="group/clear w-full">
      <Input {...inputprops} clearable={false} bind:elementRef={inputElement}>
        {#snippet right()}
          {#if field.showClear}
            <CloseButton
              class="invisible group-focus-within/clear:visible group-hover/clear:visible focus-visible:visible"
              onmousedown={(event: MouseEvent) => event.preventDefault()}
              color="none"
              title={message('control.clearValue')}
              ariaLabel={message('control.clearValue')}
              name={message('control.clearValue')}
              disabled={!binding.control.enabled}
              onclick={(event: MouseEvent) => {
                event.preventDefault();
                if (schemaSuggestions) {
                  event.stopPropagation();
                  if (!binding.control.enabled) return;
                }
                text.clear();
                if (schemaSuggestions) inputElement?.focus({ preventScroll: true });
              }}
            />
          {/if}
        {/snippet}
      </Input>
    </div>
  </ControlWrapper>
{/if}
