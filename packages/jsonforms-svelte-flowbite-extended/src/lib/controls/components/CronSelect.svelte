<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  let {
    label,
    values,
    choices,
    multiple,
    change,
    disabled,
  }: {
    label: string;
    values: string[];
    choices: { value: string; label: string }[];
    multiple: boolean;
    change: (values: string[]) => void;
    disabled: boolean;
  } = $props();
  import { MultiSelect, Select, CloseButton } from 'flowbite-svelte';
  let resetHintFocused = $state(false);
  let resetHintHovered = $state(false);
  let resetHintDismissed = $state(false);
  const resetHintOpen = $derived((resetHintFocused || resetHintHovered) && !resetHintDismissed);
  let dropdownAbove = $state(false);
  let dropdownMaxHeight = $state(256);
  function fitMultiSelectPopup(node: HTMLDivElement) {
    const positionDropdown = () => {
      const trigger = node.querySelector<HTMLElement>('[role="listbox"]');
      if (!trigger) return;
      const bounds = trigger.getBoundingClientRect();
      const frame = node.closest('[data-cron-picker]')?.getBoundingClientRect();
      const visibleTop = Math.max(0, frame?.top ?? 0);
      const visibleBottom = Math.min(window.innerHeight, frame?.bottom ?? window.innerHeight);
      const above = bounds.top - visibleTop;
      const below = visibleBottom - bounds.bottom;
      dropdownAbove = above > below;
      dropdownMaxHeight = Math.max(32, Math.min(256, (dropdownAbove ? above : below) - 16));
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) positionDropdown();
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        requestAnimationFrame(() => {
          node
            .querySelector<HTMLElement>('[role="presentation"] [data-active="true"]')
            ?.scrollIntoView({ block: 'nearest' });
        });
    };
    node.addEventListener('click', positionDropdown, true);
    node.addEventListener('keydown', handleKeydown, true);
    return {
      destroy() {
        node.removeEventListener('click', positionDropdown, true);
        node.removeEventListener('keydown', handleKeydown, true);
      },
    };
  }
</script>

<div class="grid min-w-0 grid-cols-[7rem_minmax(0,1fr)] items-center gap-2">
  <span class="text-sm">{label}</span>
  <!-- The wrapper observes Escape from the native CloseButton without becoming an interaction target. -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    use:fitMultiSelectPopup
    class="relative min-w-0"
    style={`--cron-menu-height: ${dropdownMaxHeight}px`}
    data-cron-choice
    onclick={(event: MouseEvent) => {
      const target = event.currentTarget;
      if (target instanceof HTMLElement && target.getRootNode() instanceof ShadowRoot)
        event.stopPropagation();
    }}
    onfocusin={(event) => {
      if (event.target instanceof Element && event.target.closest('[data-cron-reset]')) {
        resetHintFocused = true;
        resetHintDismissed = false;
      }
    }}
    onfocusout={(event) => {
      if (event.target instanceof Element && event.target.closest('[data-cron-reset]'))
        resetHintFocused = false;
    }}
    onkeydown={(event) => {
      if (
        event.key === 'Escape' &&
        resetHintOpen &&
        event.target instanceof Element &&
        event.target.closest('[data-cron-reset]')
      ) {
        resetHintDismissed = true;
        event.stopPropagation();
      }
    }}
  >
    {#if multiple}
      <MultiSelect
        aria-label={label}
        {disabled}
        items={choices.map((choice) => ({ value: choice.value, name: choice.label }))}
        bind:value={() => values, change}
        placeholder={message('cron.every')}
        classes={{
          close: 'hidden',
          dropdown: `max-h-[var(--cron-menu-height)] overscroll-y-contain ${dropdownAbove ? 'bottom-[calc(100%+1rem)] top-auto' : 'top-[calc(100%+1rem)]'}`,
          placeholder: 'truncate whitespace-nowrap',
          svg: 'absolute end-3 size-3',
          span: 'min-w-0 flex-1 overflow-hidden whitespace-nowrap',
        }}
        class="relative min-h-8 pe-12"
      >
        {#snippet children({ item })}
          {#if String(item.value) === values[0]}
            <span class="block min-w-0 truncate"
              >{choices
                .filter((choice) => values.includes(choice.value))
                .map((choice) => choice.label)
                .join(', ')}</span
            >
          {/if}
        {/snippet}
      </MultiSelect>
    {:else}
      <Select
        placeholder=""
        aria-label={label}
        {disabled}
        value={values[0] ?? ''}
        onchange={(event) => change([event.currentTarget.value])}
      >
        <option value="" disabled>{message('cron.chooseRepeats')}</option>
        {#each choices as choice (choice.value)}<option value={choice.value}>{choice.label}</option
          >{/each}
      </Select>
    {/if}
    {#if multiple && values.length}
      <CloseButton
        {disabled}
        class="absolute end-7 top-1/2 -translate-y-1/2"
        title={`${message('cron.every')}: ${label}`}
        ariaLabel={`${message('cron.every')}: ${label}`}
        name={`${message('cron.every')}: ${label}`}
        data-cron-reset
        onmouseenter={() => {
          resetHintHovered = true;
          resetHintDismissed = false;
        }}
        onmouseleave={() => (resetHintHovered = false)}
        onclick={() => {
          if (!disabled) change([]);
        }}
      />
      {#if resetHintOpen}<span
          role="tooltip"
          class="pointer-events-none absolute end-0 bottom-full z-50 mb-2 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-gray-900 px-2 py-1 text-xs text-white shadow-lg dark:bg-gray-700"
          >{`${message('cron.every')}: ${label}`}</span
        >{/if}
    {/if}
  </div>
</div>
