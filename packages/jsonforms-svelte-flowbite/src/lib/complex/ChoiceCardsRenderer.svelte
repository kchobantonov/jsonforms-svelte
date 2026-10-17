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
  // Radio owns a bindable group value. Restore the committed selection while a
  // branch change is awaiting confirmation (including cancellation).
  let radioValue = $state(untrack(() => String(cards.selected)));
  $effect(() => {
    void cards.pending;
    radioValue = String(cards.selected);
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
    <fieldset
      role="radiogroup"
      id={`${binding.control.id}-input`}
      aria-label={binding.control.label}
      aria-invalid={!!binding.control.errors}
      disabled={!cards.enabled}
      class={vertical ? 'grid gap-3' : 'flex flex-wrap gap-3'}
    >
      {#each cards.choices as choice, index (index)}
        {@const active = index === cards.selected}
        {@const content = active
          ? (choice.selectedContent ?? choice.content)
          : (choice.content ?? choice.selectedContent)}
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
            label: `relative flex min-w-40 items-start gap-3 rounded-lg border p-4 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 ${active ? 'border-primary-600 bg-primary-50 dark:bg-primary-900' : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'} ${choice.disabled || !cards.enabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`,
          }}
        >
          <div class="min-w-0 flex-1">
            <span>{choice.label}</span>{#if isCardPresentation(content)}
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
