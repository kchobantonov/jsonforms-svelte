<script lang="ts">
  import { tick, untrack } from 'svelte';
  import {
    DispatchRenderer,
    CardPresentation,
    isCardPresentation,
    useChoiceCards,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { SegmentedControl, Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import {
    getPortalTarget,
    getPortalRootNodeGetter,
    useCombinatorTranslations,
    useSkeletonControl,
  } from '../util';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

  const getRootNode = getPortalRootNodeGetter();
  const portalTarget = getPortalTarget();
  const props: ControlProps = $props();
  const cards = useChoiceCards(props);
  const binding = useCombinatorTranslations(useSkeletonControl(cards.binding));
  let radioValue = $state(untrack(() => (cards.selected < 0 ? null : String(cards.selected))));
  $effect(() => {
    void cards.pending;
    void cards.selecting;
    radioValue = cards.selected < 0 ? null : String(cards.selected);
  });
  async function selectValue(value: string | null) {
    if (value === null) return;
    radioValue = value;
    await cards.select(Number(value));
    // Restore the committed value after the native group processes its event.
    await tick();
    radioValue = cards.selected < 0 ? null : String(cards.selected);
  }
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
    <SegmentedControl
      value={radioValue}
      onValueChange={(event) => selectValue(event.value)}
      disabled={!cards.enabled}
      required={binding.control.required}
      invalid={!!binding.control.errors}
      orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={binding.control.label}
    >
      <SegmentedControl.Control class={vertical ? 'grid gap-3' : 'flex flex-wrap gap-3'}>
        {#each cards.choices as choice, index (index)}
          {@const active = index === cards.selected}
          {@const content = active
            ? (choice.selectedContent ?? choice.content)
            : (choice.content ?? choice.selectedContent)}
          <SegmentedControl.Item
            value={String(index)}
            disabled={choice.disabled || !cards.enabled}
            class={`card relative flex min-w-40 items-start gap-3 border p-4 data-focus-visible:outline-2 data-focus-visible:outline-offset-2 ${active ? 'preset-tonal-primary border-primary-500' : 'preset-outlined-surface-200-800'} ${choice.disabled || !cards.enabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            {#if showRadio}<span
                aria-hidden="true"
                class={`mt-0.5 size-4 shrink-0 rounded-full border ${active ? 'border-primary-500 bg-primary-500' : 'border-current'}`}
              ></span>{/if}
            <div class="min-w-0 flex-1">
              <SegmentedControl.ItemText>{choice.label}</SegmentedControl.ItemText
              >{#if isCardPresentation(content)}
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
            <SegmentedControl.ItemHiddenInput
              onfocus={binding.handleFocus}
              onblur={binding.handleBlur}
            />
          </SegmentedControl.Item>
        {/each}
      </SegmentedControl.Control>
    </SegmentedControl>
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
  <Dialog
    open={cards.pending !== undefined}
    onOpenChange={(event) => {
      if (!event.open) cards.cancel();
    }}
    {getRootNode}
  >
    <Portal target={portalTarget}>
      <Dialog.Backdrop class="bg-surface-950/40 fixed inset-0" />
      <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-sm space-y-4 p-6">
          <Dialog.Title>{binding.control.translations.clearDialogTitle}</Dialog.Title>
          <Dialog.Description>{binding.control.translations.clearDialogMessage}</Dialog.Description>
          <div class="flex justify-end gap-3">
            <button type="button" class="btn preset-outlined" onclick={cards.cancel}
              >{binding.control.translations.clearDialogDecline}</button
            >
            <button
              type="button"
              class="btn preset-filled-primary-500"
              disabled={!cards.enabled}
              onclick={cards.confirm}>{binding.control.translations.clearDialogAccept}</button
            >
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}
