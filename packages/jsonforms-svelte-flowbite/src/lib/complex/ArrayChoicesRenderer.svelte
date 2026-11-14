<script lang="ts">
  import {
    useArrayChoices,
    useRendererMessages,
    sameChoice,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Input, Button, MultiSelect } from 'flowbite-svelte';
  import {
    CloseOutline as XIcon,
    PlusOutline as PlusIcon,
    ExclamationCircleOutline as CircleAlertIcon,
  } from 'flowbite-svelte-icons';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import ValidationBadge from '../controls/components/ValidationBadge.svelte';
  import { useFlowbiteControl } from '../util';
  import { onMount } from 'svelte';
  const props: ControlProps = $props();
  const model = useArrayChoices(props);
  const focusable = () =>
    !model.disabled && (props.uischema.options?.variant !== 'chips' || model.canAdd);
  const binding = useFlowbiteControl(model.binding, undefined, undefined, focusable);
  const message = useRendererMessages();
  let controlRoot: HTMLDivElement;
  onMount(() => {
    if (!binding.initialFocus || !focusable()) return;
    const frame = requestAnimationFrame(() => {
      if (!controlRoot?.isConnected || !focusable()) return;
      const primary = [...controlRoot.querySelectorAll<HTMLElement>('[id]')].find(
        (node) => node.id === `${binding.control.id}-input`,
      );
      (primary?.matches('select[hidden]')
        ? controlRoot.querySelector<HTMLElement>('[role="listbox"]')
        : primary
      )?.focus();
    });
    return () => cancelAnimationFrame(frame);
  });
  const describedBy = $derived.by(() => {
    const existing = binding.flowbiteProps('Input')['aria-describedby'];
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
  let search = $state('');
  let dropdownAbove = $state(false);
  const chips = $derived(props.uischema.options?.variant === 'chips');
  const searchable = $derived(binding.appliedOptions.autocomplete !== false);
  $effect(() => {
    if (!searchable) search = '';
  });
  function fitMultiSelectPopup(node: HTMLDivElement) {
    const positionDropdown = () => {
      const trigger = node.querySelector<HTMLElement>('[role="listbox"]');
      if (!trigger) return;
      const bounds = trigger.getBoundingClientRect();
      dropdownAbove = bounds.top > window.innerHeight - bounds.bottom;
    };
    const handleKeydown = (event: KeyboardEvent) => {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) positionDropdown();
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        requestAnimationFrame(() => {
          node
            .querySelector<HTMLElement>('[role="presentation"] [data-active="true"]')
            ?.scrollIntoView({ block: 'nearest' });
        });
      }
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
  function add() {
    if (model.add(draft)) draft = '';
  }
  const items = $derived(
    model.nativeChoices
      .filter(
        (choice) =>
          !searchable ||
          model.selectedIds.includes(choice.id) ||
          choice.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      )
      .map((choice) => ({
        value: choice.id,
        name: choice.label,
        disabled: model.selectedIds.includes(choice.id) ? !model.canRemove : !model.canAdd,
      })),
  );
</script>

{#snippet pills()}
  {#each model.values as value, index (index)}
    <span
      class="inline-flex max-w-full items-center gap-1 rounded-md border bg-gray-100 px-2 py-0.5 text-sm text-gray-900 dark:bg-gray-700 dark:text-gray-100"
      class:border-red-500={!!model.itemError(index)}
      class:border-transparent={!model.itemError(index)}
      aria-invalid={!!model.itemError(index)}
    >
      <span class="min-w-0 truncate" title={model.label(value)}>{model.label(value)}</span>
      {#if model.itemError(index)}
        <ValidationBadge errors={model.itemErrors(index)} showCount={false}>
          <CircleAlertIcon class="size-3.5 text-red-600" />
        </ValidationBadge>
      {/if}
      <Button
        type="button"
        color="alternative"
        size="xs"
        class="size-4 shrink-0 p-0"
        disabled={!model.canRemove}
        aria-label={message('arrayChoices.remove', { label: model.label(value) })}
        onclick={() => model.remove(index)}><XIcon class="size-3" /></Button
      >
    </span>
  {/each}
{/snippet}

<ControlWrapper {...binding.controlWrapper} errors={model.errors}>
  <div bind:this={controlRoot} onfocusin={binding.handleFocus} onfocusout={binding.handleBlur}>
    {#if chips}
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        {@render pills()}
        <Input
          id={`${binding.control.id}-input`}
          class="min-w-40 flex-1"
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
        {#if model.finite}
          <datalist id={`${binding.control.id}-choices`}>
            {#each model.binding.control.options ?? [] as choice, index (index)}
              <option value={String(choice.value)}>{choice.label}</option>
            {/each}
          </datalist>
        {/if}
        <Button
          type="button"
          color="alternative"
          size="sm"
          disabled={!model.canAdd || !draft}
          aria-label={message('arrayChoices.add')}
          onclick={add}><PlusIcon class="size-4" /></Button
        >
      </div>
    {:else}
      <div class="flex flex-col gap-2">
        {#if searchable}<Input
            aria-label={message('arrayChoices.search')}
            bind:value={search}
            disabled={model.disabled}
          />{/if}
        <!-- Flowbite delegates its click handler; this wrapper only contains a retargeted Shadow DOM click. -->
        <div
          use:fitMultiSelectPopup
          role="presentation"
          onclick={(event: MouseEvent) => {
            const target = event.currentTarget;
            if (target instanceof HTMLElement && target.getRootNode() instanceof ShadowRoot)
              event.stopPropagation();
          }}
        >
          <MultiSelect
            id={`${binding.control.id}-input`}
            {items}
            bind:value={() => model.selectedIds, model.select}
            disabled={model.disabled}
            placeholder={binding.appliedOptions.placeholder ?? binding.control.label}
            aria-label={binding.control.label}
            aria-invalid={!!model.errors}
            aria-required={binding.control.required}
            aria-describedby={describedBy}
            classes={{
              close: 'hidden',
              dropdown: `max-h-[min(16rem,calc(50dvh-2rem))] ${dropdownAbove ? 'bottom-[calc(100%+1rem)] top-auto' : 'top-[calc(100%+1rem)]'}`,
            }}
          >
            {#snippet children({ item })}
              {#each model.values as value, index (index)}
                {#if sameChoice(value, model.nativeChoices.find((choice) => choice.id === item.value)?.value)}
                  <span
                    class="inline-flex max-w-full items-center gap-1 rounded-md border bg-gray-100 px-2 py-0.5 text-sm dark:bg-gray-700"
                    class:border-red-500={!!model.itemError(index)}
                    class:border-transparent={!model.itemError(index)}
                    aria-invalid={!!model.itemError(index)}
                  >
                    <span class="min-w-0 truncate">{model.label(value)}</span>
                    {#if model.itemError(index)}
                      <ValidationBadge errors={model.itemErrors(index)} showCount={false}>
                        <CircleAlertIcon class="size-3.5 text-red-600" />
                      </ValidationBadge>
                    {/if}
                    <Button
                      type="button"
                      size="xs"
                      color="alternative"
                      class="size-4 p-0"
                      disabled={!model.canRemove}
                      aria-label={message('arrayChoices.remove', { label: model.label(value) })}
                      onkeydown={(event: KeyboardEvent) => event.stopPropagation()}
                      onclick={(event: MouseEvent) => {
                        event.stopPropagation();
                        model.remove(index);
                      }}><XIcon class="size-3" /></Button
                    >
                  </span>
                {/if}
              {/each}
            {/snippet}
          </MultiSelect>
        </div>
      </div>
    {/if}
  </div>
</ControlWrapper>
