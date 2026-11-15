<!-- DefaultControlWrapper.svelte -->
<script lang="ts">
  import { twMerge } from 'tailwind-merge';
  import {
    LiteralLabelAccessorySymbol,
    type LiteralLabelAccessory,
  } from '@chobantonov/jsonforms-svelte';
  import { getContext } from 'svelte';
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

  // Value errors belong on the input and helper; invalid property names apply
  // their own label colour in AdditionalProperties.
  const baseClasses = $derived(
    twMerge(
      'has-[:focus-visible]:text-primary-500 dark:has-[:focus-visible]:text-primary-400',
      styles?.control?.root,
    ),
  );
</script>

{#snippet asterisk()}
  {#if showAsterisk}
    <span
      aria-hidden="true"
      class={twMerge('text-error-500 dark:text-error-400 ms-0.5', styles?.control?.asterisk)}
      >*</span
    >
  {/if}
{/snippet}

{#snippet helperContent()}
  {#if helpMessage || description}
    <p
      id={id + '-help'}
      role={helpMessage ? (hasErrors ? 'alert' : 'note') : undefined}
      aria-hidden={!helpMessage}
      style:visibility={helpMessage ? 'visible' : 'hidden'}
      aria-live={hasErrors ? 'assertive' : 'polite'}
      class={twMerge(
        'min-h-[1rem] text-xs wrap-break-word hyphens-auto transition-opacity duration-200',
        hasErrors ? 'text-error-500 dark:text-error-400' : 'text-surface-500 dark:text-surface-400',
        helpMessage ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {helpMessage || description}
    </p>
  {/if}
{/snippet}

{#if visible}
  {#if layout === 'horizontal'}
    <!--
      Checkbox / Switch — horizontal layout.
      gap-2 is used (not space-x-2): space-x-* relies on margin-based child
      selectors which don't work reliably in Tailwind v4 flex contexts.
      ps-6 indents the helper to align under the label text.
    -->
    <div {id} class={twMerge('flex w-full min-w-0 flex-col', baseClasses)}>
      <div class="flex min-w-0 items-center gap-2 select-none">
        {@render children()}
        {#if label}
          {#if showAccessory}
            <div class="flex min-w-0 flex-1 items-start gap-1">
              <label
                for={id + '-input'}
                class="block min-w-0 flex-1 cursor-pointer text-sm wrap-break-word whitespace-normal"
              >
                <span class="wrap-break-word whitespace-normal">{label}</span>
                {@render asterisk()}
              </label>
              {@render accessory!.snippet!()}
            </div>
          {:else}
            <label
              for={id + '-input'}
              class="block min-w-0 flex-1 cursor-pointer text-sm wrap-break-word whitespace-normal"
            >
              <span class="wrap-break-word whitespace-normal">{label}</span>
              {@render asterisk()}
            </label>
          {/if}
        {/if}
      </div>
      <div class="ps-6">
        {@render helperContent()}
      </div>
    </div>
  {:else}
    <!-- Keep the native label utility while associating only the primary control.
         Compound renderers can contain several buttons, inputs and filenames. -->
    <div {id} class={twMerge('label flex w-full min-w-0 flex-col overflow-hidden', baseClasses)}>
      {#if label}
        {#if showAccessory}
          <div class="flex min-w-0 items-start gap-1">
            <label
              for={id + '-input'}
              class="label-text block min-w-0 flex-1 wrap-break-word whitespace-normal"
            >
              <span class="wrap-break-word whitespace-normal">{label}</span>
              {@render asterisk()}
            </label>
            {@render accessory!.snippet!()}
          </div>
        {:else}
          <label
            for={id + '-input'}
            class="label-text block w-full min-w-0 wrap-break-word whitespace-normal"
          >
            <span class="wrap-break-word whitespace-normal">{label}</span>
            {@render asterisk()}
          </label>
        {/if}
      {/if}
      {@render children()}
      {@render helperContent()}
    </div>
  {/if}
{/if}
