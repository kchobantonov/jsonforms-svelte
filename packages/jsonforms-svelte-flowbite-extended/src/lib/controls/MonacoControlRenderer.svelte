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
  import { ControlWrapper, useFlowbiteControl } from '@chobantonov/jsonforms-svelte-flowbite';

  const props: ControlProps = $props();
  const jsonforms = useJsonForms();
  const binding = useFlowbiteControl(useJsonFormsControl(props));
  const language = $derived(resolveMonacoLanguage(props.uischema.options, jsonforms.core?.data));
  const convertJson = $derived(props.uischema.options?.convertJson === true);
  const editorValue = $derived(toMonacoEditorValue(binding.control.data, language, convertJson));
  const monacoOptions = $derived(resolveMonacoOptions(props.uischema.options));
  const monacoStyle = [
    '--jsonforms-monaco-border: light-dark(var(--color-gray-300, #d1d5db), var(--color-gray-600, #4b5563))',
    '--jsonforms-monaco-error: var(--color-red-500, #ef4444)',
    '--jsonforms-monaco-focus: var(--color-primary-500, #3b82f6)',
    '--jsonforms-monaco-focus-border: var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-focus-shadow: 0 0 0 1px var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-radius: 0.5rem',
    '--jsonforms-monaco-background: light-dark(#fff, var(--color-gray-800, #1f2937))',
    '--jsonforms-monaco-foreground: light-dark(#111827, var(--color-gray-50, #f9fafb))',
    '--jsonforms-monaco-button-background: light-dark(#fff, var(--color-gray-700, #374151))',
    '--jsonforms-monaco-button-hover-background: light-dark(var(--color-gray-100, #f3f4f6), var(--color-gray-600, #4b5563))',
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
    class="jsonforms-flowbite-monaco"
    style={monacoStyle}
    surfaceBackground="#fff"
    darkSurfaceBackground="var(--color-gray-800, #1f2937)"
    darkClassBasedTheme
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
