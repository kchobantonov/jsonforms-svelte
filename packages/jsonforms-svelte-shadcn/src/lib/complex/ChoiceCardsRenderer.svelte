<script lang="ts">
  import { InvalidChoiceValue } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { untrack } from 'svelte';
  import {
    ChoiceCardsFrame,
    ChoiceCardContent,
    choiceCardDescriptionIds,
    useRendererMessages,
    type ControlProps,
    useChoiceCards,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import * as RadioGroup from '@jsonforms-svelte-shadcn-ui/radio-group';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { Label } from '@jsonforms-svelte-shadcn-ui/label';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { getPortalTarget, useCombinatorTranslations, useShadcnControl } from '../util';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import LocalizedDialogContent from '../components/LocalizedDialogContent.svelte';

  const props: ControlProps = $props();
  const message = useRendererMessages();
  const cards = useChoiceCards(props);
  const binding = useCombinatorTranslations(useShadcnControl(cards.binding));
  let radioValue = $state(untrack(() => (cards.selected < 0 ? '' : String(cards.selected))));
  $effect(() => {
    void cards.pending;
    void cards.selecting;
    radioValue = cards.selected < 0 ? '' : String(cards.selected);
  });
  const { invalidValue, vertical, showRadio } = $derived(cards);
  const describedBy = $derived(choiceCardDescriptionIds(binding, invalidValue));
</script>

{#if binding.control.visible}
  <ChoiceCardsFrame {cards}>
    <ControlWrapper {...binding.controlWrapper}>
      <RadioGroup.Root
        id={`${binding.control.id}-input`}
        bind:value={radioValue}
        onValueChange={(value) => {
          if (value !== '') cards.select(Number(value));
        }}
        disabled={!cards.enabled}
        required={binding.control.required}
        orientation={vertical ? 'vertical' : 'horizontal'}
        aria-orientation={vertical ? 'vertical' : 'horizontal'}
        aria-label={binding.control.label}
        aria-describedby={describedBy}
        aria-invalid={!!binding.control.errors}
        class={vertical ? 'grid gap-3' : 'flex flex-wrap gap-3'}
      >
        {#each cards.choices as choice, index (index)}
          {@const active = index === cards.selected}
          {@const itemId = `${binding.control.id}-card-${index}`}
          <Label
            for={itemId}
            class={`has-[:focus-visible]:outline-ring relative flex w-64 max-w-full min-w-40 cursor-pointer items-start gap-2 rounded-lg border-2 p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${active ? 'bg-primary/5 ring-primary ring-1 ring-inset' : 'bg-card'} ${binding.control.errors ? 'border-destructive' : active ? 'border-primary' : 'border-border'} ${choice.disabled || !cards.enabled ? 'cursor-not-allowed opacity-50' : ''}`}
          >
            <RadioGroup.Item
              id={itemId}
              value={String(index)}
              disabled={choice.disabled || !cards.enabled}
              class={showRadio ? 'mt-0.5' : 'sr-only'}
              onfocus={binding.handleFocus}
              onblur={binding.handleBlur}
              aria-label={choice.label}
            />
            <ChoiceCardContent {cards} {choice} {active} />
          </Label>
        {/each}
      </RadioGroup.Root>
      <InvalidChoiceValue
        controlId={binding.control.id}
        value={invalidValue}
        class="text-destructive text-sm break-words"
      />
    </ControlWrapper>
  </ChoiceCardsFrame>
  <Dialog.Root
    open={cards.pending !== undefined}
    onOpenChange={(open) => {
      if (!open) cards.cancel();
    }}
  >
    <LocalizedDialogContent
      portalProps={{ to: getPortalTarget() }}
      class="max-w-sm"
      closeLabel={message('dialog.close')}
    >
      <Dialog.Title>{message('confirm.branchChange.title')}</Dialog.Title>
      <Dialog.Description>{message('confirm.branchChange.message')}</Dialog.Description>
      <Dialog.Footer>
        <Button variant="outline" onclick={cards.cancel}>{message('confirm.decline')}</Button>
        <Button disabled={!cards.enabled} onclick={cards.confirm}
          >{message('confirm.accept')}</Button
        >
      </Dialog.Footer>
    </LocalizedDialogContent>
  </Dialog.Root>
{/if}
