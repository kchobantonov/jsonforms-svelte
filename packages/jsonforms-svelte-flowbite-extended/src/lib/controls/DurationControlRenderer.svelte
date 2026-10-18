<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    type ControlProps,
    useJsonFormsControl,
    useTranslator,
  } from '@chobantonov/jsonforms-svelte';
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
  import { ClockOutline } from 'flowbite-svelte-icons';
  import { twMerge } from 'tailwind-merge';
  import {
    ControlWrapper,
    determineClearValue,
    useFlowbiteControl,
  } from '@chobantonov/jsonforms-svelte-flowbite';
  import {
    useDurationDraft,
    durationCompletions,
    durationFieldMax,
    type DurationUnit,
  } from '@chobantonov/jsonforms-svelte-extended';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useFlowbiteControl(useJsonFormsControl(props), (value) => value || clearValue);
  const t = useTranslator();

  const editor = useDurationDraft({
    get value() {
      return binding.control.data;
    },
    get path() {
      return binding.control.path;
    },
    get schema() {
      return binding.control.schema;
    },
    get enabled() {
      return binding.control.enabled && !binding.control.readonly;
    },
    get showActions() {
      return binding.appliedOptions.showActions !== false;
    },
    clearValue,
    onChange: (value) => binding.onChange(value),
  });
  const inputValue = $derived(editor.text);
  const completions = $derived(durationCompletions(editor.text));
  const showActions = $derived(binding.appliedOptions.showActions !== false);
  const handleInputChange = (value: string | null) => editor.update(value);
  const cancel = () => editor.cancel();
  const confirm = () => editor.confirm();

  const cancelLabel = $derived(
    typeof binding.appliedOptions.cancelLabel === 'string'
      ? t.value(binding.appliedOptions.cancelLabel, binding.appliedOptions.cancelLabel)
      : message('duration.cancel'),
  );
  const okLabel = $derived(
    typeof binding.appliedOptions.okLabel === 'string'
      ? t.value(binding.appliedOptions.okLabel, binding.appliedOptions.okLabel)
      : message('duration.ok'),
  );

  const inputProps = $derived.by(() => {
    const flowbiteProps = binding.flowbiteProps('Input');

    return {
      clearableColor: 'none' as CloseButtonProps['color'],
      ...flowbiteProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.clearable ? 'pe-9' : '',
        binding.styles.control.input,
        flowbiteProps.class,
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: inputValue,
      clearable: binding.clearable,
      oninput: (e: Event) => handleInputChange((e.target as HTMLInputElement).value),
      clearableOnClick: () => handleInputChange(null),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors || editor.invalidText,
      'aria-describedby': editor.invalidText ? `${binding.control.id}-duration-draft` : undefined,
      list: `${binding.control.id}-duration-completions`,
    };
  });

  const menuId = $derived(`${binding.control.id}-menu`);
  const theme = $derived(getTheme('input'));
  const { close } = $derived(inputTheme());
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="relative w-full">
    <Input {...inputProps}>
      {#snippet left()}
        <ToolbarButton
          id={menuId}
          aria-label={message('duration.open')}
          size="sm"
          background={false}
          class="pointer-events-auto"
          onclick={() => (editor.open = !editor.open)}
          disabled={!binding.control.enabled || binding.control.readonly}
        >
          <ClockOutline class="h-4 w-4" />
        </ToolbarButton>
      {/snippet}
      {#snippet children(props)}
        <input
          {...props}
          class={twMerge(
            props.class,
            'ps-9',
            `${inputProps.value !== undefined && inputProps.value !== '' && inputProps.clearable ? 'pe-9' : ''}`,
          )}
          value={inputProps.value}
          oninput={inputProps.oninput}
          onfocus={inputProps.onfocus}
          onblur={inputProps.onblur}
        />
        {#if inputProps.value !== undefined && inputProps.value !== '' && inputProps.clearable}
          <CloseButton
            class={close({ class: clsx(theme?.close) })}
            disabled={!binding.control.enabled || binding.control.readonly}
            color={inputProps.clearableColor}
            ariaLabel={message('control.clearValue')}
            name={message('control.clearValue')}
          />
        {/if}
      {/snippet}
    </Input>

    <Popover
      arrow={false}
      class="w-80"
      placement="bottom-start"
      isOpen={editor.open}
      trigger="click"
    >
      <div class="space-y-3">
        <div class="flex gap-2">
          <Button
            type="button"
            size="sm"
            color={editor.mode === 'components' ? 'primary' : 'alternative'}
            aria-pressed={editor.mode === 'components'}
            disabled={!binding.control.enabled || binding.control.readonly}
            onclick={() => editor.setMode('components')}
            >{message('duration.modeComponents')}</Button
          >
          <Button
            type="button"
            size="sm"
            color={editor.mode === 'weeks' ? 'primary' : 'alternative'}
            aria-pressed={editor.mode === 'weeks'}
            disabled={!binding.control.enabled || binding.control.readonly}
            onclick={() => editor.setMode('weeks')}>{message('duration.modeWeeks')}</Button
          >
        </div>
        {#each editor.active as unit (unit)}
          <div class="flex items-end gap-2">
            <label class="block flex-1 space-y-1">
              <span class="text-xs font-medium">{message(`duration.${unit}`)}</span>
              <Input
                type="number"
                min={0}
                max={durationFieldMax}
                step={1}
                class="w-full"
                disabled={!binding.control.enabled || binding.control.readonly}
                value={editor.fields[unit] ?? ''}
                oninput={(event: Event) =>
                  editor.updateField(unit, (event.target as HTMLInputElement).value)}
              />
            </label>
            {#if editor.mode === 'components' && editor.active.length > 1}
              <Button
                type="button"
                size="sm"
                disabled={!binding.control.enabled || binding.control.readonly}
                aria-label={message('duration.removeUnit', { unit: message(`duration.${unit}`) })}
                onclick={() => editor.remove(unit)}>×</Button
              >
            {/if}
          </div>
        {/each}
        {#if editor.mode === 'components' && editor.available.length}
          <Select
            placeholder=""
            aria-label={message('duration.addUnit')}
            value=""
            disabled={!binding.control.enabled || binding.control.readonly}
            onchange={(event) => {
              editor.add(event.currentTarget.value as DurationUnit);
              event.currentTarget.value = '';
            }}
          >
            <option value="" disabled>{message('duration.addUnit')}</option>
            {#each editor.available as unit (unit)}<option value={unit}
                >{message(`duration.${unit}`)}</option
              >{/each}
          </Select>
        {/if}
        {#if editor.invalidFields}<p role="status" class="text-sm">
            {message('duration.invalidQuantity')}
          </p>{/if}
      </div>

      {#if showActions}
        <div class="mt-3 flex justify-end gap-2 border-t border-gray-200 pt-3 dark:border-gray-700">
          <Button
            color="alternative"
            size="sm"
            onclick={(event: MouseEvent) => {
              event.stopPropagation();
              cancel();
            }}>{cancelLabel}</Button
          >
          <Button
            size="sm"
            color="primary"
            disabled={editor.invalidFields || !binding.control.enabled || binding.control.readonly}
            onclick={(event: MouseEvent) => {
              event.stopPropagation();
              confirm();
            }}>{okLabel}</Button
          >
        </div>
      {/if}
    </Popover>
  </div>
  <datalist id={`${binding.control.id}-duration-completions`}>
    {#each completions as value (value)}<option {value}></option>{/each}
  </datalist>
  {#if editor.invalidText}<p
      id={`${binding.control.id}-duration-draft`}
      role="status"
      class="text-sm"
    >
      {message('duration.incomplete')}
    </p>{/if}
</ControlWrapper>
