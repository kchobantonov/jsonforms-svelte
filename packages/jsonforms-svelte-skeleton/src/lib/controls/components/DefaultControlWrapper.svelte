<!-- DefaultControlWrapper.svelte -->
<script lang="ts">
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

  // `has-[]` propagates focus/error colour from any descendant up to the label
  // and helper text without extra prop drilling.
  const baseClasses = $derived(
    twMerge(
      'has-[:focus-visible]:text-primary-500 dark:has-[:focus-visible]:text-primary-400',
      'has-[[aria-invalid="true"]]:text-error-500 dark:has-[[aria-invalid="true"]]:text-error-400',
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
  {#if helpMessage}
    <p
      role={hasErrors ? 'alert' : 'note'}
      aria-live={hasErrors ? 'assertive' : 'polite'}
      class={twMerge(
        'min-h-[1rem] text-xs wrap-break-word hyphens-auto transition-opacity duration-200',
        hasErrors ? 'text-error-500 dark:text-error-400' : 'text-surface-500 dark:text-surface-400',
        helpMessage ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      {helpMessage}
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
          <label for={id + '-input'} class="flex min-w-0 flex-1 cursor-pointer items-center overflow-hidden text-sm">
            <span class="block min-w-0 truncate">{label}</span>
            {@render asterisk()}
          </label>
        {/if}
      </div>
      <div class="ps-6">
        {@render helperContent()}
      </div>
    </div>
  {:else}
    <!--
      Default vertical layout — Skeleton v4 pattern:
        <label class="label">
          <span class="label-text">Label</span>
          <input class="input" ... />
        </label>

      `label` = flex flex-col gap-1 (Skeleton utility)
      `label-text` = themed label typography + colour
    -->
    <label
      {id}
      for={id + '-input'}
      class={twMerge('label flex w-full min-w-0 flex-col overflow-hidden', baseClasses)}
    >
      {#if label}
        <span class="label-text flex w-0 max-w-full min-w-full items-center overflow-hidden">
          <span class="block min-w-0 truncate">{label}</span>
          {@render asterisk()}
        </span>
      {/if}
      {@render children()}
      {@render helperContent()}
    </label>
  {/if}
{/if}
