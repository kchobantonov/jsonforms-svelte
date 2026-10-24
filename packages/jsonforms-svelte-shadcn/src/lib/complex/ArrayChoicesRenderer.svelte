<script lang="ts">
  import {
    useArrayChoices,
    useRendererMessages,
    sameChoice,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import { Checkbox } from '@jsonforms-svelte-shadcn-ui/checkbox';
  import * as Popover from '@jsonforms-svelte-shadcn-ui/popover';
  import XIcon from '@lucide/svelte/icons/x';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import ControlWrapper from '../controls/ControlWrapper.svelte';
  import { getPortalTarget, useShadcnControl } from '../util';

  const props: ControlProps = $props();
  const model = useArrayChoices(props);
  const binding = useShadcnControl(model.binding);
  const message = useRendererMessages();
  let draft = $state('');
  let search = $state('');
  const chips = $derived(props.uischema.options?.variant === 'chips');
  function add() {
    if (model.add(draft)) draft = '';
  }
</script>

{#snippet pills()}
  {#each model.values as value, index (index)}
    <span
      class="bg-secondary text-secondary-foreground inline-flex max-w-full items-center gap-1 rounded-md px-2 py-0.5 text-sm"
    >
      <span class="min-w-0 truncate" title={model.label(value)}>{model.label(value)}</span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        class="size-4 shrink-0 p-0"
        disabled={!model.canRemove}
        aria-label={message('arrayChoices.remove', { label: model.label(value) })}
        onclick={() => model.remove(index)}><XIcon class="size-3" /></Button
      >
    </span>
  {/each}
{/snippet}

<ControlWrapper {...binding.controlWrapper}>
  <div onfocusin={binding.handleFocus} onfocusout={binding.handleBlur}>
    {#if chips}
      <div class="flex min-w-0 flex-wrap items-center gap-2">
        {@render pills()}
        <Input
          id={`${binding.control.id}-input`}
          class="min-w-40 flex-1"
          bind:value={draft}
          list={model.finite ? `${binding.control.id}-choices` : undefined}
          disabled={!model.canAdd}
          aria-invalid={!!binding.control.errors}
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
          variant="outline"
          size="icon"
          disabled={!model.canAdd || !draft}
          aria-label={message('arrayChoices.add')}
          onclick={add}><PlusIcon class="size-4" /></Button
        >
      </div>
    {:else}
      <Popover.Root>
        <div
          class="border-input bg-background flex min-h-9 w-full min-w-0 items-center gap-1 rounded-md border px-2 py-1"
        >
          <div class="flex max-h-32 min-w-0 flex-1 flex-wrap gap-1 overflow-auto">
            {#if model.values.length}{@render pills()}{:else}<span
                class="text-muted-foreground text-sm"
                >{binding.appliedOptions.placeholder ?? binding.control.label}</span
              >{/if}
          </div>
          <Popover.Trigger
            id={`${binding.control.id}-input`}
            aria-label={binding.control.label}
            aria-invalid={!!binding.control.errors}
            disabled={model.disabled}
            class="inline-flex size-7 shrink-0 items-center justify-center"
            ><ChevronDownIcon class="size-4" /></Popover.Trigger
          >
        </div>
        <Popover.Content
          portalProps={{ to: getPortalTarget() }}
          class="max-h-[min(20rem,var(--bits-popover-content-available-height,20rem))] overflow-hidden"
        >
          <Input class="shrink-0" aria-label={message('arrayChoices.search')} bind:value={search} />
          <div
            role="group"
            aria-label={binding.control.label}
            class="flex max-h-64 min-h-0 flex-col gap-2 overflow-auto py-2"
          >
            {#each model.choices.filter((choice) => choice.label
                .toLocaleLowerCase()
                .includes(search.toLocaleLowerCase())) as choice, index (index)}
              {@const selectedIndex = model.values.findIndex((value) =>
                sameChoice(value, choice.value),
              )}
              <label
                class="flex shrink-0 items-center gap-2"
                for={`${binding.control.id}-choice-${index}`}
              >
                <Checkbox
                  id={`${binding.control.id}-choice-${index}`}
                  bind:checked={
                    () => selectedIndex >= 0,
                    (checked) => {
                      if (checked && selectedIndex < 0 && typeof choice.value === 'string')
                        model.add(choice.value);
                      else if (!checked && selectedIndex >= 0) model.remove(selectedIndex);
                    }
                  }
                  disabled={selectedIndex >= 0 ? !model.canRemove : !model.canAdd}
                />
                {choice.label}
              </label>
            {/each}
          </div>
        </Popover.Content>
      </Popover.Root>
    {/if}
  </div>
</ControlWrapper>
