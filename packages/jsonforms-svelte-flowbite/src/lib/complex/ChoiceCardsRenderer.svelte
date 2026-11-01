<script lang="ts">
  import { untrack } from 'svelte';
  import {
    DispatchRenderer,
    CardPresentation,
    isCardPresentation,
    useChoiceCards,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Radio, Modal, Button } from 'flowbite-svelte';
  import { useCombinatorTranslations, useFlowbiteControl } from '../util';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import CombinatorProperties from './components/CombinatorProperties.svelte';

  const props: ControlProps = $props();
  const cards = useChoiceCards(props);
  const binding = useCombinatorTranslations(useFlowbiteControl(cards.binding));
  let groupElement: HTMLFieldSetElement | undefined = $state();
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
  const detail = $derived(cards.selected >= 0 ? cards.choices[cards.selected] : undefined);
  const vertical = $derived(props.uischema.options?.vertical === true);
  const showRadio = $derived(props.uischema.options?.showRadio === true);
  const describedBy = $derived(
    !binding.appliedOptions.hideControlWrapper &&
      (binding.control.errors ||
        (binding.control.description &&
          (binding.isFocused || binding.controlWrapper.persistentHint)))
      ? `${binding.control.id}-help`
      : undefined,
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
        {@const content = active
          ? (choice.selectedContent ?? choice.content)
          : (choice.content ?? choice.selectedContent)}
        {@const alternate = active ? choice.content : choice.selectedContent}
        <Radio
          name={`${binding.control.id}-cards`}
          value={String(index)}
          bind:group={radioValue}
          onchange={() => cards.select(index)}
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
        </Radio>
      {/each}
    </fieldset>
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
  <Modal
    open={cards.pending !== undefined}
    oncancel={cards.cancel}
    title={binding.control.translations.clearDialogTitle}
    size="sm"
  >
    <p>{binding.control.translations.clearDialogMessage}</p>
    <div class="flex justify-end gap-3">
      <Button color="alternative" onclick={cards.cancel}
        >{binding.control.translations.clearDialogDecline}</Button
      >
      <Button disabled={!cards.enabled} onclick={cards.confirm}
        >{binding.control.translations.clearDialogAccept}</Button
      >
    </div>
  </Modal>
{/if}
