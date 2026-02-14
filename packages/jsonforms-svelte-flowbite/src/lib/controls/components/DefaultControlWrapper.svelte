<script lang="ts">
  import { Helper, Label } from 'flowbite-svelte';
  import type { ControlWrapperProps } from '../../util';
  import { twMerge } from 'tailwind-merge';

  const {
    id,
    description,
    errors,
    label,
    visible,
    required,
    isFocused,
    styles,
    appliedOptions,
    persistentHint,
    children,
  }: ControlWrapperProps = $props();

  const hasErrors = $derived(!!errors?.trim());
  const showDescription = $derived(!hasErrors && !!description && (isFocused || persistentHint));
  const helpMessage = $derived(hasErrors ? errors : showDescription ? description : '');
  const showAsterisk = $derived(label && required && !appliedOptions.hideRequiredAsterisk);
</script>

{#if visible}
  <div {id} class={twMerge('mb-4 space-y-2', styles?.control?.root)}>
    <Label for={id + '-input'}
      >{label}{#if showAsterisk}<span
          class={styles?.control?.asterisk ?? 'text-red-600 dark:text-red-400 '}>*</span
        >
      {/if}
    </Label>
    <div class="relative">
      {@render children()}
    </div>

    {#if helpMessage}
      <Helper
        class={`text-sm ${hasErrors ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-300'}`}
        >{helpMessage}</Helper
      >
    {/if}
  </div>
{/if}
