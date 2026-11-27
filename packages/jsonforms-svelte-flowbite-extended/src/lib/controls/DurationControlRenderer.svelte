<script lang="ts">
  import { adornedInputAttributes } from '@chobantonov/jsonforms-svelte-flowbite';
  import { usePopupPlacement } from '@chobantonov/jsonforms-svelte-extended';
  import {
    useRendererMessages,
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const message = useRendererMessages();
  import clsx from 'clsx';
  import {
    Button,
    CloseButton,
    getTheme,
    Input,
    input as inputTheme,
    Popover,
    Select,
    ToolbarButton,
    type CloseButtonProps,
  } from 'flowbite-svelte';
  import { ClockOutline, CloseOutline } from 'flowbite-svelte-icons';
  import { twMerge } from 'tailwind-merge';
  import {
    ControlWrapper,
    determineClearValue,
    useFlowbiteControl,
  } from '@chobantonov/jsonforms-svelte-flowbite';
  import {
    useDurationControl,
    DurationFields,
    DurationHints,
  } from '@chobantonov/jsonforms-svelte-extended';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useFlowbiteControl(useJsonFormsControl(props), (value) => value || clearValue);

  const duration = useDurationControl(props, binding, clearValue);
  const { editor, handleInputChange, cancel } = duration;
  const { showActions, cancelLabel, okLabel } = $derived(duration);
  const inputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');
    return {
      clearableColor: 'none' as CloseButtonProps['color'],
      ...flowbiteProps,
      ...duration.inputAttributes(flowbiteProps['aria-describedby']),
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      clearable: binding.clearable,
      oninput: (e: Event) => handleInputChange((e.target as HTMLInputElement).value),
      clearableOnClick: () => handleInputChange(null),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
    };
  });

  const menuId = $derived(`${binding.control.id}-menu`);
  const popup = usePopupPlacement(512, Infinity);
  function dismissOnEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !editor.open) return;
    const root = event.currentTarget instanceof Element ? event.currentTarget.getRootNode() : null;
    event.preventDefault();
    event.stopPropagation();
    cancel();
    queueMicrotask(() => {
      if (root instanceof Document || root instanceof ShadowRoot)
        root.getElementById(menuId)?.focus();
    });
  }
  const theme = $derived(getTheme('input'));
  const { close } = $derived(inputTheme());
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="relative w-full" onkeydowncapture={dismissOnEscape}>
    <Input {...inputProps}>
      {#snippet left()}
        <ToolbarButton
          id={menuId}
          title={message('duration.open')}
          aria-label={message('duration.open')}
          aria-describedby={inputProps['aria-describedby']}
          onfocus={(event: FocusEvent) => {
            binding.handleFocus();
            popup.fit(event.currentTarget as HTMLElement);
          }}
          onblur={binding.handleBlur}
          onpointerdown={(event: PointerEvent) => popup.fit(event.currentTarget as HTMLElement)}
          aria-expanded={editor.open}
          size="sm"
          background={false}
          class="pointer-events-auto"
          onkeydowncapture={dismissOnEscape}
          disabled={duration.disabled}
        >
          <ClockOutline class="h-4 w-4" />
        </ToolbarButton>
      {/snippet}
      {#snippet children(props)}
        <input {...adornedInputAttributes(props, inputProps)} />
        {#if inputProps.value !== undefined && inputProps.value !== '' && inputProps.clearable}
          <CloseButton
            class={close({ class: clsx(theme?.close) })}
            disabled={duration.disabled}
            color={inputProps.clearableColor}
            title={message('control.clearValue')}
            ariaLabel={message('control.clearValue')}
            name={message('control.clearValue')}
          />
        {/if}
      {/snippet}
    </Input>

    <Popover
      onkeydowncapture={dismissOnEscape}
      arrow={false}
      class="w-80 max-w-[calc(100vw-2rem)]"
      classes={{
        content: 'max-h-[var(--duration-popup-max-height)] overflow-y-auto overscroll-y-contain',
      }}
      style={`--duration-popup-max-height: ${popup.maxHeight}px`}
      placement={popup.placement}
      bind:isOpen={editor.open}
      trigger="click"
      triggerDelay={0}
    >
      <DurationFields {duration} id={binding.control.id}>
        {#snippet modeButton(mode, label, attributes)}<Button
            type="button"
            size="sm"
            color={editor.mode === mode ? 'primary' : 'alternative'}
            {...attributes}>{label}</Button
          >{/snippet}
        {#snippet field(unit, id)}<Input
            {id}
            {...duration.fieldAttributes(unit)}
            class="w-full min-w-0"
          />{/snippet}
        {#snippet removeButton(attributes)}<Button
            type="button"
            size="sm"
            color="alternative"
            class="size-8 shrink-0 p-0"
            {...attributes}><CloseOutline class="size-4" aria-hidden="true" /></Button
          >{/snippet}
        {#snippet addUnit(attributes, options)}
          <Select placeholder="" {...attributes}>{@render options()}</Select>
        {/snippet}
      </DurationFields>

      {#if showActions}
        <div class="mt-3 flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
          <Button color="alternative" size="sm" onclick={duration.cancelClick}>{cancelLabel}</Button
          >
          <Button
            size="sm"
            color="primary"
            disabled={editor.invalidFields || duration.disabled}
            onclick={duration.confirmClick}>{okLabel}</Button
          >
        </div>
      {/if}
    </Popover>
  </div>
  <DurationHints {duration} id={binding.control.id} />
</ControlWrapper>
