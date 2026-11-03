<script lang="ts">
  import {
    useArrayChoices,
    useRendererMessages,
    sameChoice,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Command from '@jsonforms-svelte-shadcn-ui/command';
  import { TagsInput } from '@jsonforms-svelte-shadcn-ui/tags-input';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import XIcon from '@lucide/svelte/icons/x';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import { getPortalTarget, useShadcnControl } from '../util';
  import { onMount } from 'svelte';

  const props: ControlProps = $props();
  const model = useArrayChoices(props);
  const focusable = () =>
    !model.disabled && (props.uischema.options?.variant !== 'chips' || model.canAdd);
  const binding = useShadcnControl(model.binding, undefined, undefined, focusable);
  const message = useRendererMessages();
  let controlRoot: HTMLDivElement;
  onMount(() => {
    if (!binding.initialFocus || !focusable()) return;
    const frame = requestAnimationFrame(() => {
      if (!controlRoot?.isConnected || !focusable()) return;
      const primary = [...controlRoot.querySelectorAll<HTMLElement>('[id]')].find(
        (node) => node.id === `${binding.control.id}-input`,
      );
      primary?.focus();
    });
    return () => cancelAnimationFrame(frame);
  });
  const describedBy = $derived.by(() => {
    const existing = binding.shadcnProps('input')['aria-describedby'];
    const helpVisible =
      !binding.appliedOptions.hideControlWrapper &&
      (!!model.errors?.trim() ||
        (!!binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)));
    return (
      [existing, helpVisible ? `${binding.control.id}-help` : undefined]
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
        .join(' ') || undefined
    );
  });
  let draft = $state('');
  let open = $state(false);
  const chips = $derived(props.uischema.options?.variant === 'chips');
  const searchable = $derived(binding.appliedOptions.autocomplete === true);
  // The upstream widget represents unique strings. Keep the guarded local
  // control for repeated/typed values and for asymmetric add/remove limits.
  const nativeTags = $derived(
    chips &&
      !model.finite &&
      binding.control.schema.uniqueItems === true &&
      model.values.every((value) => typeof value === 'string') &&
      model.values.every((_, index) => !model.itemError(index)) &&
      new Set(model.values).size === model.values.length &&
      (model.disabled || (model.canAdd && (model.canRemove || model.values.length === 0))),
  );
  const stringValues = $derived(
    model.values.filter((value): value is string => typeof value === 'string'),
  );
  function setTags(next: string[]) {
    if (next.length > model.values.length) {
      const added = next.find(
        (value) => !model.values.some((current) => sameChoice(current, value)),
      );
      if (added !== undefined) model.add(added);
    } else if (next.length < model.values.length) {
      const index = model.values.findIndex(
        (value) => !next.some((current) => sameChoice(current, value)),
      );
      model.remove(index);
    }
  }
  function add() {
    if (model.add(draft)) draft = '';
  }
</script>

{#snippet pills()}
  {#each model.values as value, index (index)}
    {@const invalid = !!model.itemError(index)}
    <span
      class="bg-secondary text-secondary-foreground inline-flex max-w-full items-center gap-1 rounded-md border border-solid px-2 py-0.5 text-sm"
      class:border-destructive={invalid}
      class:border-transparent={!invalid}
      aria-invalid={invalid}
    >
      <span class="min-w-0 truncate" title={model.label(value)}>{model.label(value)}</span>
      {#if model.itemError(index)}
        <ValidationBadge errors={model.itemErrors(index)} showCount={false}>
          <CircleAlertIcon class="text-destructive size-3.5" />
        </ValidationBadge>
      {/if}
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        class="size-4 shrink-0 p-0"
        disabled={!model.canRemove}
        aria-label={message('arrayChoices.remove', { label: model.label(value) })}
        onkeydown={(event) => event.stopPropagation()}
        onclick={(event) => {
          event.stopPropagation();
          model.remove(index);
        }}><XIcon class="size-3" /></Button
      >
    </span>
  {/each}
{/snippet}

<ControlWrapper {...binding.controlWrapper} errors={model.errors}>
  <div bind:this={controlRoot} onfocusin={binding.handleFocus} onfocusout={binding.handleBlur}>
    {#if nativeTags}
      <TagsInput
        class="jsonforms-array-tags focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]"
        id={`${binding.control.id}-input`}
        value={stringValues}
        onValueChange={setTags}
        validate={(value) => (model.accepts(value) ? value : undefined)}
        removeLabel={(value) => message('arrayChoices.remove', { label: value })}
        disabled={model.disabled}
        aria-invalid={!!model.errors}
        aria-required={binding.control.required}
        aria-describedby={describedBy}
        aria-label={binding.control.label}
        placeholder={binding.appliedOptions.placeholder ?? message('chips.addPlaceholder')}
      />
    {:else if chips}
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        <div
          class="border-input bg-background focus-within:border-ring focus-within:ring-ring/50 flex min-h-9 min-w-0 flex-1 flex-wrap items-center gap-1 rounded-md border px-1 py-0.5 focus-within:ring-[3px]"
        >
          {@render pills()}
          <Input
            id={`${binding.control.id}-input`}
            class="min-w-40 flex-1 border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0"
            bind:value={draft}
            list={model.finite ? `${binding.control.id}-choices` : undefined}
            disabled={!model.canAdd}
            aria-invalid={!!model.errors}
            aria-required={binding.control.required}
            aria-describedby={describedBy}
            placeholder={binding.appliedOptions.placeholder ?? message('chips.addPlaceholder')}
            onkeydown={(event) => {
              if (event.isComposing) return;
              if (event.key === 'Enter') {
                event.preventDefault();
                add();
              } else if (event.key === 'Backspace' && draft === '') {
                event.preventDefault();
                model.remove(model.values.length - 1);
              }
            }}
          />
        </div>
        {#if model.finite}
          <datalist id={`${binding.control.id}-choices`}>
            {#each model.binding.control.options ?? [] as choice, index (index)}
              <option value={String(choice.value)}>{choice.label}</option>
            {/each}
          </datalist>
        {/if}
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={!model.canAdd || !draft}
          aria-label={message('arrayChoices.add')}
          onclick={add}><PlusIcon class="size-4" /></Button
        >
      </div>
    {:else}
      <Popover.Root bind:open={() => open, (next) => (open = next && !model.disabled)}>
        <Popover.Trigger>
          {#snippet child({ props: triggerProps })}
            <div
              {...triggerProps}
              id={`${binding.control.id}-input`}
              role="combobox"
              tabindex={model.disabled ? -1 : 0}
              aria-label={binding.control.label}
              aria-expanded={open}
              aria-invalid={!!model.errors}
              aria-required={binding.control.required}
              aria-describedby={describedBy}
              aria-disabled={model.disabled}
              class="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 flex min-h-9 w-full min-w-0 cursor-pointer items-center gap-1 rounded-md border px-2 py-1 focus-visible:ring-[3px] aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
            >
              <span class="flex max-h-32 min-w-0 flex-1 flex-wrap gap-1 overflow-auto">
                {#if model.values.length}{@render pills()}{:else}<span
                    class="text-muted-foreground text-sm"
                    >{binding.appliedOptions.placeholder ?? binding.control.label}</span
                  >{/if}
              </span>
              <ChevronDownIcon class="size-4 shrink-0 opacity-50" />
            </div>
          {/snippet}
        </Popover.Trigger>
        <Popover.Content
          portalProps={{ to: getPortalTarget() }}
          class="max-h-[min(20rem,var(--bits-popover-content-available-height,20rem))] w-[var(--bits-popover-anchor-width)] overflow-hidden p-0"
        >
          <Command.Root
            class="jsonforms-array-choices min-h-0"
            filter={(_value, query, keywords) =>
              keywords?.some((label) => label.toLowerCase().includes(query.toLowerCase())) ? 1 : 0}
          >
            {#if searchable}
              <Command.Input
                autofocus
                aria-label={message('arrayChoices.search')}
                placeholder={message('arrayChoices.search')}
              />
            {/if}
            <Command.List class="min-h-0">
              <Command.Empty>{message('enum.noMatches')}</Command.Empty>
              <Command.Group>
                {#each model.nativeChoices as choice (choice.id)}
                  {@const selected = model.selectedIds.includes(choice.id)}
                  <Command.Item
                    value={choice.id}
                    keywords={[choice.label]}
                    data-checked={selected}
                    aria-checked={selected}
                    disabled={selected ? !model.canRemove : !model.canAdd}
                    onSelect={() =>
                      model.select(
                        selected
                          ? model.selectedIds.filter((id) => id !== choice.id)
                          : [...model.selectedIds, choice.id],
                      )}
                  >
                    {choice.label}
                  </Command.Item>
                {/each}
              </Command.Group>
            </Command.List>
          </Command.Root>
        </Popover.Content>
      </Popover.Root>
    {/if}
  </div>
</ControlWrapper>

<style>
  :global(.jsonforms-array-tags input),
  :global(.jsonforms-array-tags input:focus) {
    border: 0 !important;
    box-shadow: none !important;
    outline: none !important;
  }

  :global(.jsonforms-array-tags [aria-selected='true']) {
    box-shadow: none !important;
    background-color: color-mix(in srgb, currentColor 14%, transparent) !important;
  }

  :global(
    .jsonforms-array-choices:has([data-slot='command-item']:hover)
      [data-slot='command-item'][data-selected]:not(:hover)
  ) {
    background-color: transparent;
  }

  :global(.jsonforms-array-choices [data-slot='command-item']:hover) {
    background-color: hsl(var(--muted));
  }
</style>
