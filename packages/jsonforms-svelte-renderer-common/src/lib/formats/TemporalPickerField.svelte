<script lang="ts" module>
  import type { ComponentProps, Snippet } from 'svelte';
  import TemporalTextInput from './TemporalTextInput.svelte';
  type InputProps = ComponentProps<typeof TemporalTextInput>;
  export type TemporalPickerFieldProps = Pick<InputProps, 'editor' | 'rangeError'> & {
    binding: InputProps['binding'] & {
      styles: { control: { input?: string } };
      clearable?: boolean;
    };
    attributes: InputProps['attributes'] & { class?: string | string[] | null };
    kind: 'date' | 'dateTime' | 'time';
  };
</script>

<script lang="ts">
  import { useRendererMessages } from '../locale/rendererMessages.svelte';
  const {
    binding,
    editor,
    attributes,
    kind,
    rangeError,
    merge,
    trigger,
    clear,
  }: TemporalPickerFieldProps & {
    merge: (...classes: (string | string[] | null | undefined)[]) => string;
    trigger: Snippet<[string, boolean]>;
    clear: Snippet<[string, boolean, () => void]>;
  } = $props();
  const message = useRendererMessages();
  const label = $derived(
    message(
      kind === 'date'
        ? 'temporal.chooseDate'
        : kind === 'time'
          ? 'temporal.chooseTime'
          : 'temporal.chooseDateTime',
    ),
  );
  const disabled = $derived(
    !binding.control.enabled || (kind === 'time' && binding.control.readonly),
  );
</script>

<TemporalTextInput
  {binding}
  {editor}
  {attributes}
  class={merge(
    binding.styles.control.input,
    attributes.class,
    'input w-full ps-10',
    binding.clearable ? 'pe-10' : 'pe-4',
  )}
  {rangeError}
/>
{@render trigger(label, !!disabled)}
{#if binding.clearable && editor.inputValue}
  {@render clear(message('control.clearValue'), !!disabled, () => editor.handleInputChange(null))}
{/if}
