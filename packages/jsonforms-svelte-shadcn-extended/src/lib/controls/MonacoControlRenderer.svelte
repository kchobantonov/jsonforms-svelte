<script lang="ts">
  import {
    MonacoEditor,
    useMonacoDraft,
    resolveMonacoLanguage,
    resolveMonacoOptions,
    resolveMonacoAppliedOptions,
    isMixedCodeControl,
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
  const editorOptions = $derived(
    resolveMonacoAppliedOptions(
      binding.control.config,
      binding.control.uischema.options,
      isMixedCodeControl(props.uischema, props.schema, {
        rootSchema: binding.control.rootSchema,
        config: binding.control.config,
      }),
    ),
  );
  const language = $derived(resolveMonacoLanguage(editorOptions, jsonforms.core?.data));
  const convertJson = $derived(editorOptions.convertJson === true);
  const monacoOptions = $derived(resolveMonacoOptions(editorOptions));
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
  const draft = useMonacoDraft({
    get value() {
      return binding.control.data;
    },
    get schema() {
      return binding.control.schema;
    },
    get path() {
      return binding.control.path;
    },
    get language() {
      return language;
    },
    get convertJson() {
      return convertJson;
    },
    get enabled() {
      return binding.control.enabled;
    },
    get validateJsonSchema() {
      return convertJson && editorOptions.validateJsonSchema !== false;
    },
    get propagateErrors() {
      return editorOptions.propagateErrors === true;
    },
    get locale() {
      return jsonforms.i18n?.locale;
    },
    get translate() {
      return jsonforms.i18n?.translate;
    },
    onChange: (value) => binding.onChange(value),
  });
  const displayErrors = $derived(
    [
      binding.controlWrapper.errors,
      draft.message && !binding.controlWrapper.errors?.includes(draft.message) ? draft.message : '',
    ]
      .filter(Boolean)
      .join('\n'),
  );
</script>

<ControlWrapper {...binding.controlWrapper} errors={displayErrors}>
  <MonacoEditor
    {...monacoOptions}
    id={`${binding.control.id}-input`}
    class="jsonforms-shadcn-monaco"
    style={monacoStyle}
    value={draft.text}
    locale={jsonforms.i18n?.locale}
    translator={jsonforms.i18n?.translate}
    {language}
    schema={binding.control.schema}
    rootSchema={jsonforms.core?.schema}
    validateJsonSchema={convertJson && editorOptions.validateJsonSchema !== false}
    disabled={!binding.control.enabled}
    invalid={draft.invalid || !!binding.control.errors}
    autofocus={editorOptions.focus === true}
    placeholder={typeof editorOptions.placeholder === 'string'
      ? editorOptions.placeholder
      : undefined}
    aria-label={binding.control.label}
    onvaluechange={draft.update}
    onmarkerschange={draft.updateDiagnostics}
    onfocus={binding.handleFocus}
    onblur={binding.handleBlur}
  />
</ControlWrapper>
