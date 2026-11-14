<script lang="ts">
  import { tick, untrack } from 'svelte';
  import {
    DispatchRenderer,
    CardPresentation,
    isCardPresentation,
    unselectedChoiceValueText,
    useRendererMessages,
    useChoiceCards,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { SegmentedControl, Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import {
    getPortalTargetResolver,
    getPortalRootNodeGetter,
    useCombinatorTranslations,
    useSkeletonControl,
  } from '../util';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

  const getRootNode = getPortalRootNodeGetter();
  const resolvePortalTarget = getPortalTargetResolver();
  const props: ControlProps = $props();
  const message = useRendererMessages();
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
    <SegmentedControl
      value={radioValue}
      onValueChange={(event) => selectValue(event.value)}
      disabled={!cards.enabled}
      required={binding.control.required}
      invalid={!!binding.control.errors}
      aria-invalid={!!binding.control.errors}
      orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={binding.control.label}
      aria-describedby={describedBy}
    >
      <SegmentedControl.Control class={vertical ? 'grid gap-3' : 'flex flex-wrap gap-3'}>
        {#each cards.choices as choice, index (index)}
          {@const active = index === cards.selected}
          {@const content = active
            ? (choice.selectedContent ?? choice.content)
            : (choice.content ?? choice.selectedContent)}
          {@const alternate = active ? choice.content : choice.selectedContent}
          <SegmentedControl.Item
            value={String(index)}
            disabled={choice.disabled || !cards.enabled}
            style={`border-width: 2px; ${binding.control.errors ? 'border-color: var(--color-error-500) !important;' : active ? 'border-color: var(--color-primary-500) !important;' : ''}`}
            class={`card relative flex w-64 max-w-full min-w-40 items-start gap-2 border-2 p-4 whitespace-normal data-focus-visible:outline-2 data-focus-visible:outline-offset-2 ${active ? 'preset-tonal-primary ring-primary-500 ring-1 ring-inset' : 'border-surface-200-800 bg-surface-50-950'} ${choice.disabled || !cards.enabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
          >
            {#if showRadio}<span
                aria-hidden="true"
                class={`mt-0.5 size-4 shrink-0 rounded-full border ${active ? 'border-primary-500 bg-primary-500' : 'border-current'}`}
              ></span>{/if}
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
                <SegmentedControl.ItemText class="text-surface-950-50"
                  >{choice.label}</SegmentedControl.ItemText
                >
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
            <SegmentedControl.ItemHiddenInput
              onfocus={binding.handleFocus}
              onblur={binding.handleBlur}
            />
          </SegmentedControl.Item>
        {/each}
      </SegmentedControl.Control>
    </SegmentedControl>
    {#if invalidValue !== undefined}
      <p
        id={`${binding.control.id}-invalid-value`}
        class="text-error-600-400 text-sm break-words"
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
  <Dialog
    open={cards.pending !== undefined}
    onOpenChange={(event) => {
      if (!event.open) cards.cancel();
    }}
    {getRootNode}
  >
    <Portal target={resolvePortalTarget() ?? undefined}>
      <Dialog.Backdrop class="bg-surface-950/40 fixed inset-0" />
      <Dialog.Positioner class="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Content class="card preset-filled-surface-50-950 w-full max-w-sm space-y-4 p-6">
          <Dialog.Title>{message('confirm.branchChange.title')}</Dialog.Title>
          <Dialog.Description>{message('confirm.branchChange.message')}</Dialog.Description>
          <div class="flex justify-end gap-3">
            <button type="button" class="btn preset-outlined" onclick={cards.cancel}
              >{message('confirm.decline')}</button
            >
            <button
              type="button"
              class="btn preset-filled-primary-500"
              disabled={!cards.enabled}
              onclick={cards.confirm}>{message('confirm.accept')}</button
            >
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}
