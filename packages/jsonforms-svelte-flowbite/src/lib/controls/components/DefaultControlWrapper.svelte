<!-- DefaultControlWrapper.svelte -->
<script lang="ts">
  import { Helper, Label } from 'flowbite-svelte';
  import {
    LiteralLabelAccessorySymbol,
    type LiteralLabelAccessory,
  } from '@chobantonov/jsonforms-svelte';
  import { getContext } from 'svelte';
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
  const labelAccessory = getContext<(() => LiteralLabelAccessory) | undefined>(
    LiteralLabelAccessorySymbol,
  );
  const accessory = $derived(labelAccessory?.());
  const showAccessory = $derived(accessory?.label === label && !!accessory?.snippet);

  const baseClasses = $derived(
    twMerge(
      'has-[:focus]:text-primary-500 dark:has-[:focus]:text-primary-400',
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
  {#if helpMessage || description}
    <Helper
      id={id + '-help'}
      role={helpMessage ? (hasErrors ? 'alert' : 'note') : undefined}
      aria-hidden={!helpMessage}
      style={helpMessage ? undefined : 'visibility: hidden'}
      aria-live="polite"
      class="text-xs wrap-break-word hyphens-auto {layout === 'horizontal' ? 'mt-1' : ''}"
      color={hasErrors ? 'red' : undefined}
    >
      {helpMessage || description}
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
          {#if label}
            {#if showAccessory}
              <div class="flex items-center gap-1">
                <Label for={id + '-input'} class="text-start text-sm font-medium text-current">
                  {@render labelContent()}
                </Label>
                {@render accessory!.snippet!()}
              </div>
            {:else}
              <Label for={id + '-input'} class="text-start text-sm font-medium text-current">
                {@render labelContent()}
              </Label>
            {/if}
          {/if}
          {@render helperContent()}
        </div>
      </div>
    </div>
  {:else}
    <!-- Default vertical layout -->
    <div {id} class={twMerge(baseClasses, 'relative inline-flex w-full flex-col')}>
      {#if label}
        {#if showAccessory}
          <div class="absolute start-0 top-0 z-10 flex max-w-full items-center gap-1">
            <Label
              for={id + '-input'}
              class="max-w-full origin-[0] transform truncate overflow-hidden whitespace-nowrap text-current transition-colors duration-200"
            >
              {@render labelContent()}
            </Label>
            {@render accessory!.snippet!()}
          </div>
        {:else}
          <Label
            for={id + '-input'}
            class="absolute start-0 top-0 z-10 max-w-full origin-[0] transform truncate overflow-hidden whitespace-nowrap text-current transition-colors duration-200"
          >
            {@render labelContent()}
          </Label>
        {/if}
      {/if}
      <div class={twMerge('relative', label ? 'pt-5' : '')}>
        {@render children()}
      </div>
      {@render helperContent()}
    </div>
  {/if}
{/if}
