<script lang="ts">
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte';
  const message = useRendererMessages();
  import {
    type ControlProps,
    useJsonFormsControl,
    useTranslator,
  } from '@chobantonov/jsonforms-svelte';
  import {
    ControlWrapper,
    determineClearValue,
    getPortalTarget,
    getPortalRootNodeGetter,
    useSkeletonControl,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { Clock3Icon, XIcon } from '@lucide/svelte';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    useDurationDraft,
    durationCompletions,
    durationFieldMax,
    type DurationUnit,
  } from '@chobantonov/jsonforms-svelte-extended';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useSkeletonControl(useJsonFormsControl(props), (value) => value || clearValue);
  const t = useTranslator();
  const getRootNode = getPortalRootNodeGetter();

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
    const skeletonProps = binding.skeletonProps('input');

    return {
      ...skeletonProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        skeletonProps.class,
        'input w-full ps-10',
        binding.clearable ? 'pe-10' : 'pe-4',
      ),
      disabled: !binding.control.enabled,
      readonly: binding.control.readonly,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: inputValue,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors || editor.invalidText,
      'aria-describedby': editor.invalidText ? `${binding.control.id}-duration-draft` : undefined,
      list: `${binding.control.id}-duration-completions`,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <Popover
    {...binding.skeletonProps('Popover')}
    {getRootNode}
    open={editor.open}
    onOpenChange={(details) => (editor.open = details.open)}
    positioning={{ placement: 'bottom-start' }}
  >
    <div class="group relative w-full">
      <input
        {...inputProps}
        oninput={(e: Event) => handleInputChange((e.target as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
      />

      <Popover.Trigger
        class="hover:preset-tonal rounded-base text-surface-600-400 inline-flex size-8 items-center justify-center"
        style="position: absolute; inset-block: 0; inset-inline-start: 0.25rem; margin-block: auto;"
        disabled={!binding.control.enabled || binding.control.readonly}
        aria-label={message('duration.open')}
      >
        <Clock3Icon class="size-4" />
      </Popover.Trigger>

      {#if binding.clearable && inputValue !== undefined && inputValue !== ''}
        <button
          type="button"
          class="hover:preset-tonal rounded-base text-surface-600-400 invisible inline-flex size-8 items-center justify-center opacity-0 transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 focus-visible:visible focus-visible:opacity-100"
          style="position: absolute; inset-block: 0; inset-inline-end: 0.25rem; margin-block: auto;"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => handleInputChange(null)}
          disabled={!binding.control.enabled || binding.control.readonly}
          aria-label={message('control.clearValue')}
        >
          <XIcon class="size-4" />
        </button>
      {/if}
    </div>

    <Portal target={getPortalTarget()}>
      <Popover.Positioner>
        <Popover.Content
          class="card preset-filled-surface-50-950 border-surface-200-800 w-[22rem] border p-4 shadow-xl"
        >
          <div class="space-y-3">
            <div class="flex gap-2">
              <button
                type="button"
                class={`btn btn-sm ${editor.mode === 'components' ? 'preset-filled-primary-500' : 'preset-outlined'}`}
                aria-pressed={editor.mode === 'components'}
                disabled={!binding.control.enabled || binding.control.readonly}
                onclick={() => editor.setMode('components')}
                >{message('duration.modeComponents')}</button
              >
              <button
                type="button"
                class={`btn btn-sm ${editor.mode === 'weeks' ? 'preset-filled-primary-500' : 'preset-outlined'}`}
                aria-pressed={editor.mode === 'weeks'}
                disabled={!binding.control.enabled || binding.control.readonly}
                onclick={() => editor.setMode('weeks')}>{message('duration.modeWeeks')}</button
              >
            </div>
            {#each editor.active as unit (unit)}
              <div class="flex items-end gap-2">
                <label class="block flex-1 space-y-1">
                  <span class="text-xs font-medium">{message(`duration.${unit}`)}</span>
                  <input
                    type="number"
                    min={0}
                    max={durationFieldMax}
                    step={1}
                    class="input w-full"
                    disabled={!binding.control.enabled || binding.control.readonly}
                    value={editor.fields[unit] ?? ''}
                    oninput={(event: Event) =>
                      editor.updateField(unit, (event.target as HTMLInputElement).value)}
                  />
                </label>
                {#if editor.mode === 'components' && editor.active.length > 1}
                  <button
                    type="button"
                    class="btn btn-sm preset-outlined"
                    disabled={!binding.control.enabled || binding.control.readonly}
                    aria-label={message('duration.removeUnit', {
                      unit: message(`duration.${unit}`),
                    })}
                    onclick={() => editor.remove(unit)}>×</button
                  >
                {/if}
              </div>
            {/each}
            {#if editor.mode === 'components' && editor.available.length}
              <select
                class="select w-full"
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
              </select>
            {/if}
            {#if editor.invalidFields}<p role="status" class="text-sm">
                {message('duration.invalidQuantity')}
              </p>{/if}
          </div>

          {#if showActions}
            <div class="border-surface-200-800 mt-4 flex justify-end gap-2 border-t pt-3">
              <button
                type="button"
                class="btn btn-sm preset-outlined"
                onclick={(event: MouseEvent) => {
                  event.stopPropagation();
                  cancel();
                }}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                class="btn btn-sm preset-filled-primary-500"
                disabled={editor.invalidFields ||
                  !binding.control.enabled ||
                  binding.control.readonly}
                onclick={(event: MouseEvent) => {
                  event.stopPropagation();
                  confirm();
                }}
              >
                {okLabel}
              </button>
            </div>
          {/if}
        </Popover.Content>
      </Popover.Positioner>
    </Portal>
  </Popover>
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
