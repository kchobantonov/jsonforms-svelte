<script lang="ts">
  import {
    MonacoEditor,
    fromMonacoEditorValue,
    resolveMonacoLanguage,
    resolveMonacoOptions,
    toMonacoEditorValue,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    type ControlProps,
    useJsonForms,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte';
  import { ControlWrapper, useSkeletonControl } from '@chobantonov/jsonforms-svelte-skeleton';

  const props: ControlProps = $props();
  const jsonforms = useJsonForms();
  const binding = useSkeletonControl(useJsonFormsControl(props));
  const language = $derived(resolveMonacoLanguage(props.uischema.options, jsonforms.core?.data));
  const convertJson = $derived(props.uischema.options?.convertJson === true);
  const editorValue = $derived(toMonacoEditorValue(binding.control.data, language, convertJson));
  const monacoOptions = $derived(resolveMonacoOptions(props.uischema.options));
  const monacoStyle = [
    '--jsonforms-monaco-border: var(--color-surface-200-800, #e2e8f0)',
    '--jsonforms-monaco-error: var(--color-error-500, #ef4444)',
    '--jsonforms-monaco-focus: var(--color-primary-500, #3b82f6)',
    '--jsonforms-monaco-focus-border: var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-focus-shadow: none',
    '--jsonforms-monaco-radius: var(--radius-base, 0.375rem)',
    '--jsonforms-monaco-background: var(--color-surface-50-950, Canvas)',
    '--jsonforms-monaco-foreground: var(--color-surface-950-50, CanvasText)',
    '--jsonforms-monaco-button-background: var(--color-surface-100-900, Canvas)',
    '--jsonforms-monaco-button-hover-background: var(--color-surface-200-800, #e2e8f0)',
  ].join('; ');
  const updateValue = (value: string) => {
    const next = fromMonacoEditorValue(value, language, convertJson);
    if (next.valid) binding.onChange(next.value);
  };
</script>

<ControlWrapper {...binding.controlWrapper}>
  <MonacoEditor
    {...monacoOptions}
    id={`${binding.control.id}-input`}
    class="jsonforms-skeleton-monaco"
    style={monacoStyle}
    value={editorValue}
    {language}
    disabled={!binding.control.enabled}
    invalid={!!binding.control.errors}
    autofocus={binding.appliedOptions.focus}
    placeholder={binding.appliedOptions.placeholder}
    aria-label={binding.control.label}
    onvaluechange={updateValue}
    onfocus={binding.handleFocus}
    onblur={binding.handleBlur}
  />
</ControlWrapper>
