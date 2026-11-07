<script lang="ts">
  import {
    type ControlProps,
    useJsonFormsCell,
    useRendererMessages,
    useInitialFocusRequest,
  } from '@chobantonov/jsonforms-svelte';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { Textarea } from '@jsonforms-svelte-shadcn-ui/textarea';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import XIcon from '@lucide/svelte/icons/x';
  import IntegerCell from './IntegerCell.svelte';
  import { untrack } from 'svelte';
  import CellContent from './CellContent.svelte';

  const props: ControlProps = $props();
  const binding = useJsonFormsCell(props);
  const message = useRendererMessages();
  const options = $derived({ ...binding.cell.config, ...binding.cell.uischema.options });
  const initialFocus = untrack(() => options.focus === true);
  const toFormatted = $derived(
    typeof options.toFormatted === 'function'
      ? (options.toFormatted as (value: number | undefined) => string)
      : undefined,
  );
  const fromFormatted = $derived(
    typeof options.fromFormatted === 'function'
      ? (options.fromFormatted as (value: string) => number | undefined)
      : undefined,
  );
  const hasFormatter = $derived(!!toFormatted && !!fromFormatted);
  useInitialFocusRequest(
    () => hasFormatter && initialFocus && binding.cell.visible && binding.cell.enabled,
    () => binding.cell.path,
  );
  let draft = $state<string | undefined>();
  let localError = $state('');
  let focused = $state(false);
  const errors = $derived([binding.cell.errors, localError].filter(Boolean).join('\n'));
  const helpMessage = $derived(
    errors ||
      (focused && typeof binding.cell.schema.description === 'string'
        ? binding.cell.schema.description
        : ''),
  );
  const helpId = $derived(`${binding.cell.id}-help`);
  let previousData = $state.raw(binding.cell.data);
  $effect(() => {
    const current = binding.cell.data;
    if (!Object.is(current, previousData)) {
      previousData = current;
      draft = undefined;
      localError = '';
    }
  });
  const display = $derived.by(() => {
    if (draft !== undefined) return draft;
    try {
      return (
        toFormatted?.(binding.cell.data as number | undefined) ?? String(binding.cell.data ?? '')
      );
    } catch {
      return String(binding.cell.data ?? '');
    }
  });
  function input(event: Event) {
    if (!binding.cell.enabled || !binding.cell.visible || binding.cell.readonly) return;
    const text = (event.currentTarget as HTMLInputElement | HTMLTextAreaElement).value;
    draft = text;
    try {
      const parsed = text === '' ? undefined : fromFormatted?.(text);
      if (text !== '' && parsed === undefined) {
        localError = message('numeric.integer');
        return;
      }
      if (parsed !== undefined && (!Number.isSafeInteger(parsed) || !Number.isFinite(parsed))) {
        localError = message('numeric.integer');
        return;
      }
      localError = '';
      binding.handleChange(binding.cell.path, parsed);
    } catch {
      localError = message('numeric.integer');
    }
  }
</script>

{#if hasFormatter}
  {#if binding.cell.visible}
    <CellContent {errors}>
      <div class="group relative w-full">
        {#if options.multi === true}
          <Textarea
            id={binding.cell.id}
            class="pe-10"
            value={display}
            oninput={input}
            onblur={() => {
              focused = false;
              if (!localError) draft = undefined;
            }}
            disabled={!binding.cell.enabled}
            readonly={binding.cell.readonly}
            aria-invalid={!!errors}
            aria-describedby={helpMessage ? helpId : undefined}
            onfocus={() => (focused = true)}
            autofocus={initialFocus}
            placeholder={typeof options.placeholder === 'string' ? options.placeholder : undefined}
            maxlength={binding.cell.schema.maxLength}
          />
        {:else}
          <Input
            id={binding.cell.id}
            type="text"
            class="pe-10"
            value={display}
            oninput={input}
            onblur={() => {
              focused = false;
              if (!localError) draft = undefined;
            }}
            disabled={!binding.cell.enabled}
            readonly={binding.cell.readonly}
            aria-invalid={!!errors}
            aria-describedby={helpMessage ? helpId : undefined}
            onfocus={() => (focused = true)}
            autofocus={initialFocus}
            placeholder={typeof options.placeholder === 'string' ? options.placeholder : undefined}
            maxlength={binding.cell.schema.maxLength}
          />
        {/if}
        {#if helpMessage}<span id={helpId} class="sr-only">{helpMessage}</span>{/if}
        {#if options.clearable !== false && !binding.cell.readonly && binding.cell.data !== undefined && binding.cell.data !== null}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            class="absolute inset-y-0 end-1 my-auto opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
            disabled={!binding.cell.enabled || binding.cell.readonly}
            aria-label={message('control.clearValue')}
            onclick={() => {
              if (!binding.cell.enabled || !binding.cell.visible || binding.cell.readonly) return;
              draft = undefined;
              localError = '';
              binding.handleChange(binding.cell.path, undefined);
            }}><XIcon class="size-4" /></Button
          >
        {/if}
      </div>
    </CellContent>
  {/if}
{:else}
  <IntegerCell {...props} />
{/if}
