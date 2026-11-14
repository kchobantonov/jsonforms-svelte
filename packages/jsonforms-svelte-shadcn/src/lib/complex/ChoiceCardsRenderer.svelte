<script lang="ts">
  import { untrack } from 'svelte';
  import {
    DispatchRenderer,
    CardPresentation,
    isCardPresentation,
    unselectedChoiceValueText,
    useRendererMessages,
    useChoiceCards,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import * as RadioGroup from '@jsonforms-svelte-shadcn-ui/radio-group';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { Label } from '@jsonforms-svelte-shadcn-ui/label';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { getPortalTarget, useCombinatorTranslations, useShadcnControl } from '../util';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import LocalizedDialogContent from '../components/LocalizedDialogContent.svelte';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

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
  const detail = $derived(cards.selected >= 0 ? cards.choices[cards.selected] : undefined);
  const invalidValue = $derived(
    cards.selected < 0 ? unselectedChoiceValueText(binding.control.data) : undefined,
  );
  const vertical = $derived(props.uischema.options?.vertical === true);
  const showRadio = $derived(props.uischema.options?.showRadio === true);
  const describedBy = $derived(
    [
      !binding.appliedOptions.hideControlWrapper &&
      (binding.control.errors ||
        (binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)))
        ? `${binding.control.id}-help`
        : undefined,
      invalidValue !== undefined ? `${binding.control.id}-invalid-value` : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined,
  );
</script>

{#if binding.control.visible}
  {#if cards.branchMode}
    <CombinatorProperties
      schema={binding.control.schema}
      combinatorKeyword="oneOf"
      path={binding.control.path}
      rootSchema={binding.control.rootSchema}
    />
  {/if}
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
        {@const content = active
          ? (choice.selectedContent ?? choice.content)
          : (choice.content ?? choice.selectedContent)}
        {@const alternate = active ? choice.content : choice.selectedContent}
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
          <div class="grid min-w-0 flex-1">
            <div style="grid-area: 1 / 1">
              {#if isCardPresentation(content)}
                <CardPresentation
                  schema={binding.control.schema}
                  uischema={content}
                  path={binding.control.path}
                  enabled={cards.enabled}
                  renderers={binding.control.renderers}
                  cells={binding.control.cells}
                />
              {/if}
              <span>{choice.label}</span>
            </div>
            {#if alternate !== content && isCardPresentation(alternate)}
              <div style="grid-area: 1 / 1; visibility: hidden" inert aria-hidden="true">
                <CardPresentation
                  schema={binding.control.schema}
                  uischema={alternate}
                  path={binding.control.path}
                  enabled={cards.enabled}
                  renderers={binding.control.renderers}
                  cells={binding.control.cells}
                />
                <span>{choice.label}</span>
              </div>
            {/if}
          </div>
        </Label>
      {/each}
    </RadioGroup.Root>
    {#if invalidValue !== undefined}
      <p
        id={`${binding.control.id}-invalid-value`}
        class="text-destructive text-sm break-words"
        role="status"
      >
        {message('control.invalidCurrentValue', { value: invalidValue })}
      </p>
    {/if}
  </ControlWrapper>
  {#if cards.branchMode && detail?.schema && detail.uischema}
    <div class="mt-4">
      <DispatchRenderer
        schema={detail.schema}
        uischema={detail.uischema}
        path={binding.control.path}
        enabled={cards.enabled}
        renderers={binding.control.renderers}
        cells={binding.control.cells}
      />
    </div>
  {/if}
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
