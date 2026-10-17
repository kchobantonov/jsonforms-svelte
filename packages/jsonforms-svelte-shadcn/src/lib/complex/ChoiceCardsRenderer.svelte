<script lang="ts">
  import { untrack } from 'svelte';
  import {
    DispatchRenderer,
    CardPresentation,
    isCardPresentation,
    useChoiceCards,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import * as RadioGroup from '@jsonforms-svelte-shadcn-ui/radio-group';
  import * as Dialog from '@jsonforms-svelte-shadcn-ui/dialog';
  import { Label } from '@jsonforms-svelte-shadcn-ui/label';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { getPortalTarget, useCombinatorTranslations, useShadcnControl } from '../util';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

  const props: ControlProps = $props();
  const cards = useChoiceCards(props);
  const binding = useCombinatorTranslations(useShadcnControl(cards.binding));
  let radioValue = $state(untrack(() => (cards.selected < 0 ? '' : String(cards.selected))));
  $effect(() => {
    void cards.pending;
    radioValue = cards.selected < 0 ? '' : String(cards.selected);
  });
  const detail = $derived(cards.selected >= 0 ? cards.choices[cards.selected] : undefined);
  const vertical = $derived(binding.appliedOptions.vertical === true);
  const showRadio = $derived(binding.appliedOptions.showRadio === true);
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
      aria-label={binding.control.label}
      aria-invalid={!!binding.control.errors}
      class={vertical ? 'grid gap-3' : 'flex flex-wrap gap-3'}
    >
      {#each cards.choices as choice, index (index)}
        {@const active = index === cards.selected}
        {@const content = active
          ? (choice.selectedContent ?? choice.content)
          : (choice.content ?? choice.selectedContent)}
        {@const itemId = `${binding.control.id}-card-${index}`}
        <Label
          for={itemId}
          class={`has-[:focus-visible]:outline-ring relative flex min-w-40 cursor-pointer items-start gap-3 rounded-lg border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${active ? 'border-primary bg-primary/5' : 'border-border bg-card'} ${choice.disabled || !cards.enabled ? 'cursor-not-allowed opacity-50' : ''}`}
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
          <div class="min-w-0 flex-1">
            <span>{choice.label}</span>
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
          </div>
        </Label>
      {/each}
    </RadioGroup.Root>
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
    <Dialog.Content portalProps={{ to: getPortalTarget() }} class="max-w-sm">
      <Dialog.Title>{binding.control.translations.clearDialogTitle}</Dialog.Title>
      <Dialog.Description>{binding.control.translations.clearDialogMessage}</Dialog.Description>
      <Dialog.Footer>
        <Button variant="outline" onclick={cards.cancel}
          >{binding.control.translations.clearDialogDecline}</Button
        >
        <Button disabled={!cards.enabled} onclick={cards.confirm}
          >{binding.control.translations.clearDialogAccept}</Button
        >
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
