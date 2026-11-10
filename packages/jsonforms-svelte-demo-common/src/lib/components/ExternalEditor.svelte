<script lang="ts">
  import { untrack, type Snippet, type Component } from 'svelte';
  let {
    value = $bindable(''),
    editor: Editor,
    onchange,
    label,
    hint,
    invalid,
    header,
    frameClass = '',
    editorClass = '',
    editorStyle = '',
  } = $props<{
    value?: string;
    editor: Component<any>;
    onchange: (value: Record<string, unknown>) => void;
    label: string;
    hint: string;
    invalid: string;
    header?: Snippet<[() => void, boolean]>;
    frameClass?: string;
    editorClass?: string;
    editorStyle?: string;
  }>();
  const id = $props.id();
  let error = $derived.by(() => {
    try {
      const parsed = JSON.parse(value);
      return (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed) ||
        !parsed.settings ||
        typeof parsed.settings !== 'object' ||
        Array.isArray(parsed.settings)
      );
    } catch {
      return true;
    }
  });
  $effect(() => {
    const draft = value;
    if (!error) untrack(() => onchange(JSON.parse(draft)));
  });
</script>

<section aria-label={label} class="space-y-4">
  {#if header}{@render header(() => {
      if (!error) onchange(JSON.parse(value));
    }, error)}{:else}<h2 class="text-xl font-bold">{label}</h2>{/if}
  <p id={`${id}-hint`} class="sr-only">{hint}</p>
  <div class={frameClass}>
    <Editor
      bind:value
      language="json"
      aria-label={label}
      aria-describedby={`${id}-hint`}
      class={editorClass}
      style={editorStyle}
    />
  </div>
  {#if error}<p role="alert">{invalid}</p>{/if}
</section>
