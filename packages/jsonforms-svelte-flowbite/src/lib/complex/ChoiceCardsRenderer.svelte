<script lang="ts">
  import { InvalidChoiceValue } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { tick, untrack } from 'svelte';
  import {
    ChoiceCardsFrame,
    ChoiceCardContent,
    choiceCardDescriptionIds,
    useRendererMessages,
    type ControlProps,
    useChoiceCards,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Radio, Modal, Button } from 'flowbite-svelte';
  import { useCombinatorTranslations, useFlowbiteControl } from '../util';
  import ControlWrapper from '../controls/ControlWrapper.svelte';

  const props: ControlProps = $props();
  const message = useRendererMessages();
  const cards = useChoiceCards(props);
  const binding = useCombinatorTranslations(useFlowbiteControl(cards.binding));
  let groupElement: HTMLFieldSetElement | undefined = $state();
  let returnFocus: HTMLInputElement | undefined;
  function restoreFocus() {
    void tick().then(() => {
      if (returnFocus?.isConnected) returnFocus.focus();
    });
  }
  function cancelPending() {
    cards.cancel();
    restoreFocus();
  }
  // Radio owns a bindable group value. Restore the committed selection while a
  // branch change is awaiting confirmation (including cancellation).
  let radioValue = $state(untrack(() => String(cards.selected)));
  $effect(() => {
    void cards.pending;
    void cards.selecting;
    radioValue = String(cards.selected);
  });
  // Flowbite's radio group can lose its checked DOM state after demo hydration.
  // Restore the committed selection after rendering, including when a branch
  // change awaits confirmation or is cancelled.
  $effect(() => {
    const selected = cards.selected;
    void cards.pending;
    void cards.selecting;
    const frame = requestAnimationFrame(() => {
      groupElement
        ?.querySelectorAll<HTMLInputElement>('input[type="radio"]')
        .forEach((input, index) => {
          input.checked = index === selected;
        });
    });
    return () => cancelAnimationFrame(frame);
  });
  const { invalidValue, vertical, showRadio } = $derived(cards);
  const describedBy = $derived(choiceCardDescriptionIds(binding, invalidValue));
</script>

{#if binding.control.visible}
  <ChoiceCardsFrame {cards}>
    <ControlWrapper {...binding.controlWrapper}>
      <fieldset
        bind:this={groupElement}
        role="radiogroup"
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        id={`${binding.control.id}-input`}
        aria-label={binding.control.label}
        aria-describedby={describedBy}
        aria-invalid={!!binding.control.errors}
        disabled={!cards.enabled}
        class={vertical ? 'grid gap-3' : 'flex flex-wrap gap-3'}
      >
        {#each cards.choices as choice, index (index)}
          {@const active = index === cards.selected}
          <Radio
            name={`${binding.control.id}-cards`}
            value={String(index)}
            bind:group={radioValue}
            onchange={(event) => {
              returnFocus = event.currentTarget as HTMLInputElement;
              void cards.select(index);
            }}
            disabled={choice.disabled || !cards.enabled}
            required={binding.control.required}
            aria-label={choice.label}
            class={showRadio ? 'mt-0.5' : 'sr-only'}
            onfocus={binding.handleFocus}
            onblur={binding.handleBlur}
            classes={{
              label: `relative flex w-64 max-w-full min-w-40 items-start gap-2 rounded-lg border-2 p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${active ? 'bg-primary-50 ring-primary-600 ring-1 ring-inset dark:bg-primary-900' : 'bg-white dark:bg-gray-800'} ${binding.control.errors ? 'border-red-500' : active ? 'border-primary-600' : 'border-gray-300 dark:border-gray-600'} ${choice.disabled || !cards.enabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`,
            }}
          >
            <ChoiceCardContent {cards} {choice} {active} />
          </Radio>
        {/each}
      </fieldset>
      <InvalidChoiceValue
        controlId={binding.control.id}
        value={invalidValue}
        class="text-sm break-words text-red-600 dark:text-red-400"
      />
    </ControlWrapper>
  </ChoiceCardsFrame>
  <Modal
    open={cards.pending !== undefined}
    oncancel={cancelPending}
    onclose={restoreFocus}
    title={message('confirm.branchChange.title')}
    size="sm"
  >
    <p>{message('confirm.branchChange.message')}</p>
    <div class="flex justify-end gap-3">
      <Button color="alternative" onclick={cancelPending}>{message('confirm.decline')}</Button>
      <Button disabled={!cards.enabled} onclick={cards.confirm}>{message('confirm.accept')}</Button>
    </div>
  </Modal>
{/if}
