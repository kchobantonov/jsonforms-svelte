<script lang="ts">
  import { untrack, type Snippet, type Component, type ComponentProps } from 'svelte';
  import DemoEditorHeading from './DemoEditorHeading.svelte';
  let {
    value = $bindable(''),
    editor: Editor,
    onchange,
    label,
    hint,
    invalid,
    header,
    button,
    onreload,
    applyLabel,
    reloadLabel,
    frameClass = '',
    editorClass = '',
    editorStyle = '',
  }: {
    value?: string;
    editor: Component<{
      value: string;
      language?: string;
      'aria-label'?: string;
      'aria-describedby'?: string;
      class?: string;
      style?: string;
    }>;
    onchange: (value: Record<string, unknown>) => void;
    label: string;
    hint: string;
    invalid: string;
    button?: ComponentProps<typeof DemoEditorHeading>['button'];
    onreload?: () => void;
    applyLabel?: string;
    reloadLabel?: string;
    header?: Snippet<[() => void, boolean]>;
    frameClass?: string;
    editorClass?: string;
    editorStyle?: string;
  } = $props();
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
  function apply() {
    if (!error) onchange(JSON.parse(value));
  }
</script>

<section aria-label={label} class="space-y-4">
  {#if header}{@render header(
      apply,
      error,
    )}{:else if button && onreload && applyLabel && reloadLabel}
    <DemoEditorHeading
      title={label}
      {button}
      {onreload}
      {applyLabel}
      {reloadLabel}
      onapply={apply}
      invalid={error}
    />{:else}<h2 class="text-xl font-bold">{label}</h2>{/if}
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
