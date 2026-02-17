<!-- DefaultControlWrapper.svelte -->
<script lang="ts">
  import { Helper, Label } from 'flowbite-svelte';
  import { twMerge } from 'tailwind-merge';
  import type { ControlWrapperProps } from '../../util';

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
    layout = 'vertical',
  }: ControlWrapperProps & { layout?: 'vertical' | 'horizontal' } = $props();

  const hasErrors = $derived(!!errors?.trim());
  const showDescription = $derived(!hasErrors && !!description && (isFocused || persistentHint));
  const helpMessage = $derived(hasErrors ? errors : showDescription ? description : '');
  const showAsterisk = $derived(label && required && !appliedOptions.hideRequiredAsterisk);

  const baseClasses = $derived(
    twMerge(
      'has-[:focus]:text-primary-500 dark:has-[:focus]:text-primary-400',
      'has-[[aria-invalid="true"]]:text-red-500 dark:has-[[aria-invalid="true"]]:text-red-400',
      'text-gray-700 dark:text-gray-200',
      styles?.control?.root,
    ),
  );
</script>

{#snippet labelContent()}
  {label}{#if showAsterisk}<span
      aria-hidden="true"
      class={twMerge(styles?.control?.asterisk, 'text-red-500 dark:text-red-400')}>*</span
    >
  {/if}
{/snippet}

{#snippet helperContent()}
  {#if helpMessage}
    <Helper
      role="alert"
      aria-live="polite"
      class="text-xs wrap-break-word hyphens-auto {layout === 'horizontal' ? 'mt-1' : ''}"
      color={hasErrors ? 'red' : undefined}
    >
      {helpMessage}
    </Helper>
  {/if}
{/snippet}

{#if visible}
  {#if layout === 'horizontal'}
    <!-- Checkbox/Radio layout -->
    <div {id} class={baseClasses}>
      <div class={twMerge('flex items-start gap-2', label ? 'pt-5' : '')}>
        <div class="flex h-5 items-center">
          {@render children()}
        </div>
        <div class="flex-1">
          <Label for={id + '-input'} class="text-start text-sm font-medium text-current">
            {@render labelContent()}
          </Label>
          {@render helperContent()}
        </div>
      </div>
    </div>
  {:else}
    <!-- Default vertical layout -->
    <div {id} class={twMerge(baseClasses, 'relative inline-flex w-full flex-col')}>
      <Label
        for={id + '-input'}
        class="absolute start-0 top-0 z-10 max-w-full origin-[0] transform truncate overflow-hidden whitespace-nowrap text-current transition-colors duration-200"
      >
        {@render labelContent()}
      </Label>
      <div class={twMerge('relative', label ? 'pt-5' : '')}>
        {@render children()}
      </div>
      {@render helperContent()}
    </div>
  {/if}
{/if}
