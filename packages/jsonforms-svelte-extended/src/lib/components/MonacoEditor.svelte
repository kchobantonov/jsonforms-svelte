<script module lang="ts">
  import monacoStyles from 'monaco-editor/min/vs/editor/editor.main.css?inline';
  import monacoEditorStyles from './MonacoEditor.css?inline';

  const stylesByRoot = new WeakMap<
    ShadowRoot | HTMLHeadElement,
    { style: HTMLStyleElement; users: number }
  >();

  const acquireComponentStyles = (root: HTMLElement): (() => void) => {
    const node = root.getRootNode();
    const target = node instanceof ShadowRoot ? node : document.head;
    let ownership = stylesByRoot.get(target);
    if (!ownership || !ownership.style.isConnected) {
      // A host-supplied stylesheet with this id is not owned by this component.
      if (target.querySelector('#jsonforms-monaco-editor-styles')) return () => {};
      const style = document.createElement('style');
      style.id = 'jsonforms-monaco-editor-styles';
      style.textContent = `${monacoStyles}\n${monacoEditorStyles}`;
      target.appendChild(style);
      ownership = { style, users: 0 };
      stylesByRoot.set(target, ownership);
    }
    const entry = ownership;
    entry.users += 1;
    return () => {
      entry.users -= 1;
      if (entry.users !== 0) return;
      if (stylesByRoot.get(target) === entry) stylesByRoot.delete(target);
      entry.style.remove();
    };
  };
</script>

<script lang="ts">
  import type { JsonSchema, Translator } from '@jsonforms/core';
  import { createMonacoSchemaRegistration } from '../core/monacoSchema';
  import { translateEditorMessage } from '../core/editorMessages';
  import type * as Monaco from 'monaco-editor';
  import { onDestroy, onMount, tick, untrack } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { useUIDiagnosticReporter } from '@chobantonov/jsonforms-svelte';

  type EditorOptions = Omit<
    Monaco.editor.IStandaloneEditorConstructionOptions,
    'language' | 'model' | 'theme' | 'value'
  >;

  interface OptionKeys {
    [key: string]: OptionKeys | null;
  }

  const optionKeys = (value: unknown): OptionKeys => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        nested && typeof nested === 'object' && Object.getPrototypeOf(nested) === Object.prototype
          ? optionKeys(nested)
          : null,
      ]),
    );
  };

  const removedOptions = (previous: OptionKeys, current: OptionKeys): Record<string, unknown> => {
    const removed: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(previous)) {
      if (!Object.hasOwn(current, key)) removed[key] = undefined;
      else if (nested && current[key]) {
        const nestedRemoved = removedOptions(nested, current[key]);
        if (Object.keys(nestedRemoved).length) removed[key] = nestedRemoved;
      }
    }
    return removed;
  };

  const withRemovedOptions = (
    current: Record<string, unknown>,
    removed: Record<string, unknown>,
  ): Record<string, unknown> => {
    const result = { ...removed, ...current };
    for (const [key, value] of Object.entries(removed)) {
      if (value && typeof value === 'object' && current[key] && typeof current[key] === 'object')
        result[key] = withRemovedOptions(
          current[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        );
    }
    return result;
  };

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    value: string;
    subject?: unknown;
    validateDiagnostics?: boolean;
    ondiagnosticspending?: (pending: boolean) => void;
    ondiagnosticserror?: () => void;
    language?: string;
    appearance?: string;
    locale?: string;
    translator?: Translator;
    schema?: JsonSchema;
    rootSchema?: JsonSchema;
    validateJsonSchema?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    required?: boolean;
    autofocus?: boolean;
    placeholder?: string;
    rows?: number;
    minRows?: number;
    maxRows?: number;
    autoGrow?: boolean;
    width?: string;
    height?: string;
    surfaceBackground?: string;
    darkSurfaceBackground?: string;
    darkClassBasedTheme?: boolean;
    options?: EditorOptions;
    initActions?: string[];
    onvaluechange?: (value: string) => void;
    onmarkerschange?: (errorCount: number) => void;
    onfocus?: () => void;
    onblur?: () => void;
  }

  let {
    value,
    subject,
    validateDiagnostics = false,
    ondiagnosticspending,
    ondiagnosticserror,
    language = 'plaintext',
    appearance,
    locale,
    translator,
    schema,
    rootSchema,
    validateJsonSchema = false,
    disabled = false,
    readonly = false,
    invalid = false,
    required = false,
    autofocus = false,
    placeholder = '',
    rows = 10,
    minRows = 3,
    maxRows = 30,
    autoGrow = false,
    width,
    height,
    surfaceBackground,
    darkSurfaceBackground,
    darkClassBasedTheme = false,
    options = {},
    initActions = [],
    onvaluechange,
    onmarkerschange,
    onfocus,
    onblur,
    class: className,
    ...rest
  }: Props = $props();

  const reportDiagnostic = useUIDiagnosticReporter();
  let root: HTMLElement | null = $state(null);
  let container: HTMLElement | null = $state(null);
  let editor: Monaco.editor.IStandaloneCodeEditor | undefined;
  let editorInput = $state<HTMLElement | null>(null);
  let monaco: typeof Monaco | undefined;
  let previousOptionKeys: OptionKeys = {};
  // The editor may report a newer line count than the incoming prop while typing.
  // eslint-disable-next-line svelte/prefer-writable-derived
  let contentRows = $state(untrack(() => value.split('\n').length));
  $effect(() => {
    contentRows = value.split('\n').length;
  });
  let maximized = $state(false);
  let darkMode = $state(false);
  let disposed = false;
  let loading = $state(true);
  let failed = $state(false);
  let schemaRegistration: ReturnType<typeof createMonacoSchemaRegistration> | undefined;
  let registeredSchemaKey: string | undefined;
  let modelSubject: unknown;
  let modelSchemaKey: string | undefined;
  let diagnosticReader:
    | ReturnType<typeof import('../core/monacoDiagnostics').createMonacoDiagnosticReader>
    | undefined;
  let diagnosticVersion = 0;
  let failedDiagnosticLanguage: string | undefined;
  let diagnosticDefaults: Monaco.IDisposable[] = [];
  let markerSubscription: Monaco.IDisposable | undefined;
  let changeSubscription: Monaco.IDisposable | undefined;
  let focusSubscription: Monaco.IDisposable | undefined;
  let blurSubscription: Monaco.IDisposable | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let themeObserver: MutationObserver | undefined;
  let mediaQuery: MediaQueryList | undefined;
  let syncFallbackTheme: ((dark: boolean) => void) | undefined;
  let activeThemeName: (() => string) | undefined;
  let warnedTheme: string | undefined;
  let releaseComponentStyles: (() => void) | undefined;

  const normalizedRows = $derived(
    autoGrow ? Math.max(minRows, Math.min(maxRows, contentRows)) : rows,
  );
  const maximizeLabel = $derived(
    translateEditorMessage(locale, translator, maximized ? 'editor.restore' : 'editor.maximize'),
  );
  const editorHeight = $derived(height ?? `${normalizedRows * 20 + 20}px`);
  const resolvedSurfaceBackground = $derived(
    darkMode && darkSurfaceBackground ? darkSurfaceBackground : surfaceBackground,
  );

  $effect(() => {
    if (!editorInput) return;
    const describedBy = rest['aria-describedby'];
    if (describedBy) editorInput.setAttribute('aria-describedby', describedBy);
    else editorInput.removeAttribute('aria-describedby');
    if (invalid) editorInput.setAttribute('aria-invalid', 'true');
    else editorInput.removeAttribute('aria-invalid');
    if (required) editorInput.setAttribute('aria-required', 'true');
    else editorInput.removeAttribute('aria-required');
  });

  const parentOrShadowHost = (element: Element): Element | null => {
    if (element.parentElement) return element.parentElement;
    const currentRoot = element.getRootNode();
    return currentRoot instanceof ShadowRoot ? currentRoot.host : null;
  };

  const explicitMode = (): 'dark' | 'light' | 'system' | undefined => {
    if (appearance === 'dark' || appearance === 'light' || appearance === 'system')
      return appearance;
    let current: Element | null = root;
    while (current) {
      const mode = current.getAttribute('data-mode');
      if (mode === 'dark' || mode === 'light' || mode === 'system') return mode;
      if (current.classList.contains('light')) return 'light';
      if (
        current.classList.contains('dark') ||
        current.classList.contains('app-dark') ||
        current.getAttribute('data-theme') === 'dark'
      ) {
        return 'dark';
      }
      current = parentOrShadowHost(current);
    }
    // Class-based themes such as Flowbite express light mode by removing the
    // `dark` class, so absence of that class is an explicit light selection.
    if (darkClassBasedTheme) return 'light';
    return undefined;
  };

  const isDark = () => {
    const mode = explicitMode();
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    if (mode === 'system') return mediaQuery?.matches ?? false;
    if (root) {
      // Read the surrounding application rather than this editor. The editor's
      // own light/dark class sets color-scheme and would otherwise lock the
      // fallback in its previous mode after the host changes back.
      const themeSource = parentOrShadowHost(root) ?? root;
      const colorScheme = getComputedStyle(themeSource).colorScheme.trim();
      if (colorScheme === 'dark' || colorScheme.startsWith('dark ')) return true;
      if (colorScheme === 'light' || colorScheme.startsWith('light ')) return false;
    }
    return mediaQuery?.matches ?? false;
  };

  // Monaco themes are global. The fallback only changes Monaco's built-in theme;
  // a custom theme installed by the host application remains authoritative.
  const syncTheme = () => {
    darkMode = isDark();
    const requestedTheme =
      appearance && !['light', 'dark', 'system'].includes(appearance) ? appearance : undefined;
    if (requestedTheme) {
      const active = activeThemeName?.();
      if (active === requestedTheme) warnedTheme = undefined;
      else if (active && warnedTheme !== requestedTheme) {
        reportDiagnostic('monaco.themeNotActive', {
          severity: 'warning',
          message: 'The requested Monaco theme is not active; the host must activate it.',
          details: { requestedTheme, activeTheme: active },
        });
        warnedTheme = requestedTheme;
      }
      return;
    }
    warnedTheme = undefined;
    syncFallbackTheme?.(darkMode);
  };

  $effect(() => {
    void appearance;
    syncTheme();
  });

  const observeThemeSources = () => {
    themeObserver = new MutationObserver(syncTheme);
    // Local traversal bookkeeping; this collection is never rendered or retained.
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const observed = new Set<Element>();
    let current: Element | null = root;
    while (current) {
      if (!observed.has(current)) {
        observed.add(current);
        themeObserver.observe(current, {
          attributes: true,
          attributeFilter: ['class', 'data-mode', 'data-theme', 'style'],
        });
      }
      current = parentOrShadowHost(current);
    }
  };

  const updateContentRows = () => {
    contentRows = editor?.getModel()?.getLineCount() ?? rows;
  };

  const toggleMaximized = async () => {
    maximized = !maximized;
    await tick();
    editor?.layout();
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && maximized) void toggleMaximized();
  };

  const syncSchemaRegistration = () => {
    const active = validateJsonSchema && language === 'json' && schema !== undefined;
    const key = active ? JSON.stringify([schema, rootSchema ?? schema]) : undefined;
    if (!schemaRegistration || key === registeredSchemaKey) return;
    registeredSchemaKey = key;
    if (active) schemaRegistration.update(schema!, rootSchema ?? schema!);
    else schemaRegistration.clear();
  };
  $effect(syncSchemaRegistration);

  // MarkerService drops modelVersionId in Monaco 0.55. Give external target
  // versions separate URIs so late worker results cannot belong to a new value.
  $effect(() => {
    const nextValue = value;
    const nextLanguage = language;
    const nextSubject = subject;
    const nextSchemaKey = JSON.stringify([validateJsonSchema, schema, rootSchema]);
    if (!editor || !monaco) return;
    const previous = editor.getModel();
    if (
      !previous ||
      (previous.getValue() === nextValue &&
        previous.getLanguageId() === nextLanguage &&
        modelSubject === nextSubject &&
        modelSchemaKey === nextSchemaKey)
    )
      return;
    const viewState = editor.saveViewState();
    const focused = editor.hasTextFocus();
    const next = monaco.editor.createModel(nextValue, nextLanguage);
    modelSubject = nextSubject;
    modelSchemaKey = nextSchemaKey;
    schemaRegistration?.clear();
    guardOwnedModel(previous);
    editor.setModel(next);
    updateContentRows();
    schemaRegistration = createMonacoSchemaRegistration(
      monaco.json.jsonDefaults,
      next.uri.toString(),
    );
    registeredSchemaKey = undefined;
    syncSchemaRegistration();
    if (viewState) editor.restoreViewState(viewState);
    if (focused) editor.focus();
    if (!previous.isDisposed()) previous.dispose();
    if (validateDiagnostics && diagnosticReader?.supports(nextLanguage))
      ondiagnosticspending?.(true);
    onmarkerschange?.(0);
  });

  $effect(() => {
    const currentOptionKeys = optionKeys(options);
    // Monaco merges updates into the existing editor. Explicitly clear options
    // removed by the caller so they return to Monaco's defaults.
    const updatedOptions = withRemovedOptions(
      options,
      removedOptions(previousOptionKeys, currentOptionKeys),
    );
    const nextOptions = {
      placeholder: placeholder || undefined,
      ...updatedOptions,
      readOnly: readonly || disabled || options.readOnly === true,
      domReadOnly: disabled || options.domReadOnly === true,
    } as EditorOptions;
    previousOptionKeys = currentOptionKeys;
    editor?.updateOptions(nextOptions);
  });

  $effect(() => {
    // Track geometry before scheduling Monaco layout after the DOM update.
    void editorHeight;
    void width;
    void tick().then(() => editor?.layout());
  });

  const validateCurrentDiagnostics = () => {
    const generation = ++diagnosticVersion;
    const model = editor?.getModel();
    if (!model || !diagnosticReader) {
      failedDiagnosticLanguage = undefined;
      return;
    }
    if (!validateDiagnostics || !diagnosticReader.supports(model.getLanguageId())) {
      failedDiagnosticLanguage = undefined;
      ondiagnosticspending?.(false);
      return;
    }
    const version = model.getVersionId();
    ondiagnosticspending?.(true);
    const current = () =>
      !disposed &&
      generation === diagnosticVersion &&
      !model.isDisposed() &&
      editor?.getModel() === model &&
      model.getVersionId() === version;
    void tick().then(async () => {
      if (!current()) return;
      try {
        const count = await diagnosticReader!.read(model);
        if (!current()) return;
        failedDiagnosticLanguage = undefined;
        onmarkerschange?.(count);
        ondiagnosticspending?.(false);
      } catch {
        if (!current()) return;
        // A failed validation is not a confirmed valid result.
        const failedLanguage = model.getLanguageId();
        if (failedDiagnosticLanguage !== failedLanguage) {
          failedDiagnosticLanguage = failedLanguage;
          reportDiagnostic('monaco.diagnosticValidationFailed', {
            severity: 'warning',
            message: 'Monaco diagnostic validation failed; the draft remains invalid.',
            details: { language: failedLanguage },
          });
        }
        onmarkerschange?.(1);
        ondiagnosticserror?.();
        ondiagnosticspending?.(false);
      }
    });
  };
  const diagnosticsConfiguration = $derived(
    JSON.stringify([language, schema, rootSchema, validateDiagnostics]),
  );
  $effect(() => {
    void value;
    void subject;
    void diagnosticsConfiguration;
    // Host callbacks publish validity into the form. Their reactive reads must
    // not make that publication schedule another validation of unchanged input.
    untrack(validateCurrentDiagnostics);
  });

  onMount(() => {
    contentRows = value.split('\n').length;
    if (root) releaseComponentStyles = acquireComponentStyles(root);
    const setup = async () => {
      const api = await import('./monaco-api.js');
      if (disposed || !container || !root) return;
      monaco = api.monaco;
      diagnosticReader = api.createMonacoDiagnosticReader(monaco);
      diagnosticDefaults = [
        monaco.json.jsonDefaults,
        monaco.typescript.typescriptDefaults,
        monaco.typescript.javascriptDefaults,
        monaco.css.cssDefaults,
        monaco.css.scssDefaults,
        monaco.css.lessDefaults,
      ].map((defaults) => defaults.onDidChange(validateCurrentDiagnostics));
      syncFallbackTheme = api.syncMonacoFallbackTheme;
      activeThemeName = api.activeMonacoThemeName;
      api.ensureMonacoWorkers();
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', syncTheme);
      observeThemeSources();

      editor = monaco.editor.create(container, {
        value,
        language,
        automaticLayout: true,
        minimap: { enabled: false },
        // Match the demo editors: background occurrence requests can reject on teardown.
        occurrencesHighlight: 'off',
        fontSize: 13,
        formatOnPaste: true,
        scrollBeyondLastLine: false,
        ariaLabel: rest['aria-label'] ?? undefined,
        placeholder: placeholder || undefined,
        ...options,
        readOnly: readonly || disabled || options.readOnly === true,
        domReadOnly: disabled || options.domReadOnly === true,
      });
      editorInput =
        editor
          .getDomNode()
          ?.querySelector<HTMLElement>(
            '.native-edit-context[role="textbox"], textarea.inputarea',
          ) ?? null;
      modelSubject = subject;
      modelSchemaKey = JSON.stringify([validateJsonSchema, schema, rootSchema]);
      schemaRegistration = createMonacoSchemaRegistration(
        monaco.json.jsonDefaults,
        editor.getModel()!.uri.toString(),
      );
      syncSchemaRegistration();
      changeSubscription = editor.onDidChangeModelContent(() => {
        updateContentRows();
        onvaluechange?.(editor!.getValue());
        validateCurrentDiagnostics();
      });
      const publishMarkers = () => {
        const model = editor?.getModel();
        if (!model || !monaco || disposed) return;
        if (validateDiagnostics && diagnosticReader?.supports(model.getLanguageId())) return;
        onmarkerschange?.(
          monaco.editor
            .getModelMarkers({ resource: model.uri })
            .filter((marker) => marker.severity === monaco!.MarkerSeverity.Error).length,
        );
      };
      markerSubscription = monaco.editor.onDidChangeMarkers((resources) => {
        const uri = editor?.getModel()?.uri.toString();
        if (resources.some((resource) => resource.toString() === uri)) publishMarkers();
      });
      publishMarkers();
      validateCurrentDiagnostics();
      focusSubscription = editor.onDidFocusEditorWidget(() => onfocus?.());
      blurSubscription = editor.onDidBlurEditorWidget(() => onblur?.());
      resizeObserver = new ResizeObserver(() => editor?.layout());
      resizeObserver.observe(root);
      updateContentRows();
      syncTheme();
      await tick();
      if (disposed) return;
      if (autofocus) editor.focus();
      window.addEventListener('keydown', handleKeydown);
      // Optional language actions may still be registering, but the editor is
      // already ready for interaction.
      loading = false;
      const actionModel = editor.getModel();
      let actionVersion = actionModel?.getVersionId();
      const actionTargetChanged = () =>
        editor?.getModel() !== actionModel || actionModel?.getVersionId() !== actionVersion;
      for (const actionId of initActions) {
        if (disposed || actionTargetChanged()) return;
        const action = editor.getAction(actionId);
        if (!action) continue;
        // Language contributions register their providers asynchronously after
        // the model activates. An action can exist before it is usable.
        const deadline = Date.now() + 2000;
        while (
          !disposed &&
          !actionTargetChanged() &&
          !action.isSupported() &&
          Date.now() < deadline
        ) {
          await new Promise<void>((resolve) => setTimeout(resolve, 25));
        }
        if (disposed || actionTargetChanged()) return;
        if (!action.isSupported()) continue;
        try {
          await action.run();
          actionVersion = actionModel?.getVersionId();
        } catch (error) {
          if (!disposed || !(error instanceof Error) || error.name !== 'Canceled') throw error;
        }
      }
    };
    void setup()
      .then(() => {
        if (!disposed) loading = false;
      })
      .catch(() => {
        if (disposed) return;
        disposeEditor();
        loading = false;
        failed = true;
        reportDiagnostic('editor.loadError', {
          severity: 'warning',
          message: 'The code editor could not be loaded.',
          details: { language },
        });
      });
  });

  const guardOwnedModel = (ownedModel: Monaco.editor.ITextModel) => {
    // Monaco 0.55 can finish reactive editor and worker computations after an
    // editor is removed. Those computations still inspect the retired model.
    // Guard only this owned model; active and host-owned models are untouched.
    const getWordUntilPosition = ownedModel.getWordUntilPosition.bind(ownedModel);
    ownedModel.getWordUntilPosition = (position) =>
      ownedModel.isDisposed()
        ? { word: '', startColumn: position.column, endColumn: position.column }
        : getWordUntilPosition(position);
    const getVersionId = ownedModel.getVersionId.bind(ownedModel);
    ownedModel.getVersionId = () => (ownedModel.isDisposed() ? 0 : getVersionId());
    const getLineLength = ownedModel.getLineLength.bind(ownedModel);
    ownedModel.getLineLength = (lineNumber) =>
      ownedModel.isDisposed() ? 0 : getLineLength(lineNumber);
  };

  const disposeEditor = () => {
    disposed = true;
    diagnosticVersion += 1;
    for (const subscription of diagnosticDefaults) subscription.dispose();
    diagnosticReader?.dispose();
    if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKeydown);
    mediaQuery?.removeEventListener('change', syncTheme);
    themeObserver?.disconnect();
    resizeObserver?.disconnect();
    markerSubscription?.dispose();
    changeSubscription?.dispose();
    focusSubscription?.dispose();
    blurSubscription?.dispose();
    const ownedModel = editor?.getModel();
    if (ownedModel) guardOwnedModel(ownedModel);
    editor?.setModel(null);
    editor?.dispose();
    editor = undefined;
    editorInput = null;
    schemaRegistration?.clear();
    if (ownedModel && !ownedModel.isDisposed()) ownedModel.dispose();
    releaseComponentStyles?.();
    releaseComponentStyles = undefined;
    syncFallbackTheme = undefined;
    activeThemeName = undefined;
  };
  onDestroy(disposeEditor);
</script>

<div
  bind:this={root}
  {...rest}
  aria-busy={loading}
  class={`jsonforms-monaco-editor ${disabled ? 'jsonforms-monaco-editor--disabled' : ''} ${invalid ? 'jsonforms-monaco-editor--invalid' : ''} ${maximized ? 'jsonforms-monaco-editor--maximized' : ''} ${className ?? ''}`}
  class:jsonforms-monaco-editor--dark={darkMode}
  class:jsonforms-monaco-editor--light={!darkMode}
  class:jsonforms-monaco-editor--custom-surface={!!resolvedSurfaceBackground}
  style={`--jsonforms-monaco-height: ${editorHeight}; ${width === undefined ? '' : `--jsonforms-monaco-width: ${width};`} ${resolvedSurfaceBackground ? `--jsonforms-monaco-surface-background: ${resolvedSurfaceBackground};` : ''} ${rest.style ?? ''}`}
>
  {#if loading || failed}
    <p class="jsonforms-monaco-editor__status" role={failed ? 'alert' : 'status'}>
      {translateEditorMessage(locale, translator, failed ? 'editor.loadError' : 'editor.loading')}
    </p>
  {/if}
  <div bind:this={container} class="jsonforms-monaco-editor__surface"></div>
  <button
    type="button"
    disabled={loading || failed}
    class="jsonforms-monaco-editor__maximize"
    aria-label={maximizeLabel}
    title={maximizeLabel}
    onclick={toggleMaximized}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {#if maximized}
        <path
          d="M8 3v3a2 2 0 0 1-2 2H3M16 3v3a2 2 0 0 0 2 2h3M8 21v-3a2 2 0 0 0-2-2H3M16 21v-3a2 2 0 0 1 2-2h3"
        ></path>
      {:else}
        <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"></path>
      {/if}
    </svg>
  </button>
</div>
