<script lang="ts" generics="T">
  import { CloseButton, Select, type SelectProps } from 'flowbite-svelte';
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

<div class="relative">
  <Select
    {...props}
    bind:elementRef={selectElement}
    placeholder={placeholder ?? message('control.selectOption')}
    clearable={false}
  />
  {#if clearable && props.value !== '' && props.value !== undefined}
    <CloseButton
      color="none"
      size="sm"
      class="absolute end-7 top-1/2 -translate-y-1/2"
      ariaLabel={clearLabel ?? message('control.clearValue')}
      name={clearLabel ?? message('control.clearValue')}
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
  {/if}
</div>
