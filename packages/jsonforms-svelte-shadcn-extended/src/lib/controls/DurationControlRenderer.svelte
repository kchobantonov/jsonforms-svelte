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
    useShadcnControl,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import * as Select from '@jsonforms-svelte-shadcn-ui/select';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import { Clock3Icon, XIcon } from '@lucide/svelte';
  import { twMerge } from 'tailwind-merge';
  import {
    useDurationDraft,
    durationCompletions,
    durationFieldMax,
    type DurationUnit,
  } from '@chobantonov/jsonforms-svelte-extended';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useShadcnControl(useJsonFormsControl(props), (value) => value || clearValue);
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
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: 'text',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
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
  <Popover.Root {...binding.shadcnProps('Popover')} bind:open={editor.open}>
    <div class="group relative w-full">
      <Input
        {...inputProps}
        oninput={(e: Event) => handleInputChange((e.target as HTMLInputElement).value)}
        onfocus={binding.handleFocus}
        onblur={binding.handleBlur}
      />

      <Popover.Trigger
        class="text-muted-foreground hover:bg-accent absolute inset-y-0 start-1 my-auto inline-flex size-8 items-center justify-center rounded-md"
        disabled={!binding.control.enabled || binding.control.readonly}
        aria-label={message('duration.open')}
      >
        <Clock3Icon class="size-4" />
      </Popover.Trigger>

      {#if binding.clearable && inputValue !== undefined && inputValue !== ''}
        <Button
          variant="ghost"
          size="icon"
          class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          onmousedown={(event: MouseEvent) => event.preventDefault()}
          onclick={() => handleInputChange(null)}
          disabled={!binding.control.enabled || binding.control.readonly}
          aria-label={message('control.clearValue')}
        >
          <XIcon class="size-4" />
        </Button>
      {/if}
    </div>

    <Popover.Content portalProps={{ to: getPortalTarget() }} align="start" class="w-80 p-4">
      <div class="space-y-3">
        <div class="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={editor.mode === 'components' ? 'default' : 'outline'}
            aria-pressed={editor.mode === 'components'}
            disabled={!binding.control.enabled || binding.control.readonly}
            onclick={() => editor.setMode('components')}
            >{message('duration.modeComponents')}</Button
          >
          <Button
            type="button"
            size="sm"
            variant={editor.mode === 'weeks' ? 'default' : 'outline'}
            aria-pressed={editor.mode === 'weeks'}
            disabled={!binding.control.enabled || binding.control.readonly}
            onclick={() => editor.setMode('weeks')}>{message('duration.modeWeeks')}</Button
          >
        </div>
        {#each editor.active as unit (unit)}
          <div class="grid grid-cols-[1fr_2rem] items-center gap-1">
            <label class="grid grid-cols-2 items-center gap-2">
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
              <span>{message(`duration.${unit}`)}</span>
            </label>
            {#if editor.mode === 'components' && editor.active.length > 1}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                class="size-8"
                disabled={!binding.control.enabled || binding.control.readonly}
                aria-label={message('duration.removeUnit', { unit: message(`duration.${unit}`) })}
                onclick={() => editor.remove(unit)}><XIcon class="size-4" /></Button
              >
            {/if}
          </div>
        {/each}
        {#if editor.mode === 'components' && editor.available.length}
          <Select.Root
            type="single"
            value=""
            disabled={!binding.control.enabled || binding.control.readonly}
            onValueChange={(value) => {
              if (value) editor.add(value as DurationUnit);
            }}
          >
            <Select.Trigger aria-label={message('duration.addUnit')} class="w-full"
              >{message('duration.addUnit')}</Select.Trigger
            >
            <Select.Content portalProps={{ to: getPortalTarget() }}>
              {#each editor.available as unit (unit)}<Select.Item
                  value={unit}
                  label={message(`duration.${unit}`)}>{message(`duration.${unit}`)}</Select.Item
                >{/each}
            </Select.Content>
          </Select.Root>
        {/if}
        {#if editor.invalidFields}<p role="status" class="text-sm">
            {message('duration.invalidQuantity')}
          </p>{/if}
      </div>

      {#if showActions}
        <div class="border-border mt-4 flex justify-end gap-2 border-t pt-3">
          <Button
            variant="outline"
            size="sm"
            onclick={(event: MouseEvent) => {
              event.stopPropagation();
              cancel();
            }}
          >
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            disabled={editor.invalidFields || !binding.control.enabled || binding.control.readonly}
            onclick={(event: MouseEvent) => {
              event.stopPropagation();
              confirm();
            }}
          >
            {okLabel}
          </Button>
        </div>
      {/if}
    </Popover.Content>
  </Popover.Root>
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
