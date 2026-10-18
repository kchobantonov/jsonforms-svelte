<script lang="ts">
  import type { JsonSchema } from '@jsonforms/core';
  import { onDestroy, tick, untrack, type Snippet } from 'svelte';
  import { registerDetailDialogChange } from '../detailDialog.svelte';
  import { useOwnedErrors } from '../ownedErrors.svelte';

  let {
    value,
    length,
    schema,
    path,
    id,
    label,
    revealed,
    disabled,
    readonly = false,
    invalid,
    required,
    autofocus = false,
    onchange,
    onfocus,
    onblur,
    input,
  }: {
    value: string;
    length: number;
    schema?: JsonSchema;
    path?: string;
    id: string;
    label: string;
    revealed: boolean;
    disabled: boolean;
    readonly?: boolean;
    invalid: boolean;
    required: boolean;
    autofocus?: boolean;
    onchange: (value: string) => void;
    onfocus: () => void;
    onblur: () => void;
    input: Snippet<
      [
        {
          id: string;
          type: 'text' | 'password';
          value: string;
          disabled: boolean;
          readonly: boolean;
          required: boolean;
          autofocus: boolean;
          autocomplete: 'one-time-code';
          'aria-label': string;
          'aria-invalid': boolean;
          onfocus: (event: Event) => void;
          onblur: () => void;
          oninput: (event: Event) => void;
          oncompositionstart: (event: CompositionEvent) => void;
          oncompositionend: (event: CompositionEvent) => void;
          onpaste: (event: ClipboardEvent) => void;
          onkeydown: (event: KeyboardEvent) => void;
        },
      ]
    >;
  } = $props();

  let container: HTMLDivElement;
  let draft = $state(untrack(() => value));
  let composing = $state<number>();
  let previous = untrack(() => value);
  let previousId = untrack(() => id);
  let previousLength = untrack(() => length);
  let previousSchema = untrack(() => schema);
  let previousPath = untrack(() => path);
  let lastWritten: string | undefined;
  let revision = 0;
  const owner = useOwnedErrors()?.createOwner();
  function cancel() {
    const index = composing;
    composing = undefined;
    revision++;
    owner?.clear();
    draft = value;
    if (index !== undefined) {
      const target = container?.querySelectorAll('input')[index];
      if (target) target.value = Array.from(value)[index] ?? '';
    }
  }
  // Host replacements win; feedback from this control must not interrupt the next edit.
  $effect(() => {
    const current = { value, id, length, schema, path, disabled, readonly };
    untrack(() => {
      const moved =
        current.id !== previousId ||
        current.length !== previousLength ||
        current.schema !== previousSchema ||
        current.path !== previousPath;
      if (current.value !== previous || moved || current.disabled || current.readonly) {
        const ownFeedback =
          !moved && !current.disabled && !current.readonly && current.value === lastWritten;
        if (!ownFeedback) {
          cancel();
          lastWritten = undefined;
        }
        previous = current.value;
        previousId = current.id;
        previousLength = current.length;
        previousSchema = current.schema;
        previousPath = current.path;
      }
    });
  });
  registerDetailDialogChange({ cancel, isBlocked: () => composing !== undefined });
  onDestroy(() => {
    cancel();
    owner?.dispose();
  });
  const chars = $derived(Array.from(draft));
  async function focus(index: number) {
    const currentRevision = revision;
    await tick();
    if (currentRevision !== revision || disabled || !container?.isConnected) return;
    const target = container.querySelectorAll('input')[Math.max(0, Math.min(length - 1, index))];
    target?.focus();
    target?.select();
  }
  function commit(next: string[]) {
    if (disabled || readonly || composing !== undefined) return;
    const nextValue = next.join('');
    if (nextValue === draft) return;
    draft = nextValue;
    lastWritten = nextValue;
    onchange(nextValue);
  }
  function replace(index: number, text: string) {
    if (disabled || readonly || composing !== undefined) return;
    const start = Math.min(index, chars.length);
    const inserted = Array.from(text);
    commit(
      [...chars.slice(0, start), ...inserted, ...chars.slice(start + inserted.length)].slice(
        0,
        length,
      ),
    );
    void focus(start + inserted.length);
  }
  function keydown(event: KeyboardEvent, index: number) {
    if (event.isComposing || composing !== undefined) return;
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      void focus(
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? length - 1
            : index + (event.key === 'ArrowLeft' ? -1 : 1),
      );
    } else if (!disabled && !readonly && event.key === 'Backspace' && !chars[index] && index > 0) {
      event.preventDefault();
      commit([...chars.slice(0, index - 1), ...chars.slice(index)]);
      void focus(index - 1);
    }
  }
</script>

<div
  bind:this={container}
  role="group"
  aria-label={label}
  class="flex min-w-0 gap-1 overflow-x-auto"
>
  {#each Array.from({ length }, (_, index) => index) as index (index)}
    {@render input({
      id: index === 0 ? id : `${id}-${index}`,
      type: revealed ? 'text' : 'password',
      value: chars[index] ?? '',
      disabled,
      readonly,
      required: required && index === 0,
      autofocus: autofocus && index === 0,
      autocomplete: 'one-time-code',
      'aria-label': `${label} ${index + 1} / ${length}`,
      'aria-invalid': invalid,
      onfocus: (event) => {
        onfocus();
        (event.currentTarget as HTMLInputElement).select();
      },
      onblur,
      oninput: (event) => {
        if (disabled || readonly) {
          (event.currentTarget as HTMLInputElement).value = chars[index] ?? '';
          return;
        }
        if (composing !== undefined || (event as InputEvent).isComposing) return;
        const text = (event.currentTarget as HTMLInputElement).value;
        if (text) replace(index, text);
        else commit([...chars.slice(0, index), ...chars.slice(index + 1)]);
      },
      oncompositionstart: () => {
        if (disabled || readonly) return;
        composing = index;
        owner?.begin('', true);
      },
      oncompositionend: (event) => {
        const target = event.currentTarget as HTMLInputElement;
        if (composing !== index || disabled || readonly) {
          target.value = chars[index] ?? '';
          return;
        }
        composing = undefined;
        owner?.clear();
        replace(index, target.value);
      },
      onpaste: (event) => {
        if (composing !== undefined) return;
        event.preventDefault();
        replace(index, event.clipboardData?.getData('text') ?? '');
      },
      onkeydown: (event) => keydown(event, index),
    })}
  {/each}
</div>
