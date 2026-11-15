<script lang="ts" generics="T">
  import { CloseButton, Select, Tooltip, type SelectProps } from 'flowbite-svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';

  const message = useRendererMessages();
  let selectElement = $state<HTMLSelectElement>();
  const {
    clearable = false,
    clearLabel,
    onClear,
    clearableOnClick,
    placeholder,
    ...props
  }: SelectProps<T> & { clearLabel?: string } = $props();
</script>

<div class="select-shell relative">
  <Select
    {...props}
    bind:elementRef={selectElement}
    placeholder={placeholder ?? message('control.selectOption')}
    clearable={false}
  />
  {#if clearable && props.value !== '' && props.value !== undefined && props.value !== null}
    <CloseButton
      color="none"
      size="sm"
      class="select-clear pointer-events-none absolute end-7 top-1/2 -translate-y-1/2 opacity-0"
      ariaLabel={clearLabel ?? message('control.clearValue')}
      name={clearLabel ?? message('control.clearValue')}
      title={clearLabel ?? message('control.clearValue')}
      disabled={props.disabled}
      onmousedown={(event: MouseEvent) => event.preventDefault()}
      onclick={(event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (props.disabled) return;
        onClear?.();
        clearableOnClick?.();
        selectElement?.focus({ preventScroll: true });
      }}
    />
    <Tooltip>{clearLabel ?? message('control.clearValue')}</Tooltip>
  {/if}
</div>

<style>
  .select-shell :global(.select-clear) {
    opacity: 0;
    pointer-events: none;
  }

  .select-shell:hover :global(.select-clear),
  .select-shell:focus-within :global(.select-clear) {
    opacity: 1;
    pointer-events: auto;
  }

  @media (hover: none) {
    .select-shell :global(.select-clear) {
      opacity: 1;
      pointer-events: auto;
    }
  }
</style>
