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
  import { ControlWrapper, useShadcnControl } from '@chobantonov/jsonforms-svelte-shadcn';

  const props: ControlProps = $props();
  const jsonforms = useJsonForms();
  const binding = useShadcnControl(useJsonFormsControl(props));
  const language = $derived(resolveMonacoLanguage(props.uischema.options, jsonforms.core?.data));
  const convertJson = $derived(props.uischema.options?.convertJson === true);
  const editorValue = $derived(toMonacoEditorValue(binding.control.data, language, convertJson));
  const monacoOptions = $derived(resolveMonacoOptions(props.uischema.options));
  const monacoStyle = [
    '--jsonforms-monaco-border: hsl(var(--input, 214.3 31.8% 91.4%))',
    '--jsonforms-monaco-error: hsl(var(--destructive, 0 84.2% 60.2%))',
    '--jsonforms-monaco-focus: hsl(var(--ring, 222.2 84% 4.9%))',
    '--jsonforms-monaco-focus-border: var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-focus-shadow: 0 0 0 2px var(--jsonforms-monaco-focus)',
    '--jsonforms-monaco-radius: calc(var(--radius, 0.5rem) - 2px)',
    '--jsonforms-monaco-shadow: 0 1px 3px 0 rgb(0 0 0 / 10%), 0 1px 2px -1px rgb(0 0 0 / 10%)',
    '--jsonforms-monaco-background: hsl(var(--background, 0 0% 100%))',
    '--jsonforms-monaco-foreground: hsl(var(--foreground, 222.2 84% 4.9%))',
    '--jsonforms-monaco-button-background: hsl(var(--background, 0 0% 100%))',
    '--jsonforms-monaco-button-hover-background: hsl(var(--muted, 210 40% 96.1%))',
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
    class="jsonforms-shadcn-monaco"
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
