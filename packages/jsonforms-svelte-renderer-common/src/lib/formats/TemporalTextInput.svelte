<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { maska } from 'maska/svelte';
  import type { useJsonFormsControl } from '../core/jsonFormsCompositions.svelte';
  import type { useTemporalEditor } from './temporalEditor.svelte';
  import { controlHelpVisible, joinDescriptionIds } from '../controls/controlHelp';

  const {
    binding,
    editor,
    attributes,
    class: className,
    rangeError,
  }: {
    binding: Parameters<typeof controlHelpVisible>[0] & {
      control: ReturnType<typeof useJsonFormsControl>['control'];
      appliedOptions: { placeholder?: string };
      initialFocus: boolean | undefined;
      handleFocus(): void;
      handleBlur(): void;
    };
    editor: ReturnType<typeof useTemporalEditor>;
    attributes: HTMLInputAttributes;
    class: string;
    rangeError: boolean;
  } = $props();
</script>

<!-- svelte-ignore a11y_autofocus -->
<input
  {...attributes}
  type="text"
  id={`${binding.control.id}-input`}
  class={className}
  disabled={!binding.control.enabled}
  readonly={binding.control.readonly}
  autofocus={binding.initialFocus}
  placeholder={binding.appliedOptions.placeholder ?? editor.displayFormat}
  value={editor.inputValue}
  required={binding.control.required}
  aria-invalid={!!binding.control.errors}
  aria-describedby={joinDescriptionIds(
    attributes['aria-describedby'],
    controlHelpVisible(binding) ? `${binding.control.id}-help` : undefined,
    editor.hasDraft ? `${binding.control.id}-draft-hint` : undefined,
    rangeError ? `${binding.control.id}-draft-range` : undefined,
  )}
  oninput={(event) => editor.handleInputChange(event.currentTarget.value)}
  onfocus={binding.handleFocus}
  onblur={binding.handleBlur}
  use:maska={editor.maskOptions}
/>
