<script lang="ts">
  import type { JsonSchema, Translator } from '@jsonforms/core';
  import { createMonacoSchemaRegistration } from '../core/monacoSchema';
  import { translateEditorMessage } from '../core/editorMessages';
  import type * as Monaco from 'monaco-editor';
  import monacoStyles from 'monaco-editor/min/vs/editor/editor.main.css?inline';
  import { onDestroy, onMount, tick } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import monacoEditorStyles from './MonacoEditor.css?inline';

  type EditorOptions = Omit<
    Monaco.editor.IStandaloneEditorConstructionOptions,
    'language' | 'model' | 'theme' | 'value'
  >;

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'onchange'> {
    value: string;
    language?: string;
    locale?: string;
    translator?: Translator;
    schema?: JsonSchema;
    rootSchema?: JsonSchema;
    validateJsonSchema?: boolean;
    disabled?: boolean;
    readonly?: boolean;
    invalid?: boolean;
    autofocus?: boolean;
    placeholder?: string;
    rows?: number;
    minRows?: number;
    maxRows?: number;
    autoGrow?: boolean;
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
    language = 'plaintext',
    locale,
    translator,
    schema,
    rootSchema,
    validateJsonSchema = false,
    disabled = false,
    readonly = false,
    invalid = false,
    autofocus = false,
    placeholder = '',
    rows = 8,
    minRows = 3,
    maxRows = 20,
    autoGrow = false,
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

  let root: HTMLElement | null = $state(null);
  let container: HTMLElement | null = $state(null);
  let editor: Monaco.editor.IStandaloneCodeEditor | undefined;
  let monaco: typeof Monaco | undefined;
  let contentRows = $state(8);
  let maximized = $state(false);
  let darkMode = $state(false);
  let disposed = false;
  let loading = $state(true);
  let failed = $state(false);
  let schemaRegistration: ReturnType<typeof createMonacoSchemaRegistration> | undefined;
  let registeredSchemaKey: string | undefined;
  let markerSubscription: Monaco.IDisposable | undefined;
  let changeSubscription: Monaco.IDisposable | undefined;
  let focusSubscription: Monaco.IDisposable | undefined;
  let blurSubscription: Monaco.IDisposable | undefined;
  let resizeObserver: ResizeObserver | undefined;
  let themeObserver: MutationObserver | undefined;
  let mediaQuery: MediaQueryList | undefined;
  let syncFallbackTheme: ((dark: boolean) => void) | undefined;

  const normalizedRows = $derived(
    Math.min(
      Math.max(Math.max(1, minRows), maxRows),
      Math.max(Math.max(1, minRows), autoGrow ? contentRows : rows),
    ),
  );
  const maximizeLabel = $derived(
    translateEditorMessage(locale, translator, maximized ? 'editor.restore' : 'editor.maximize'),
  );
  const editorHeight = $derived(`${normalizedRows * 20 + 20}px`);
  const resolvedSurfaceBackground = $derived(
    darkMode && darkSurfaceBackground ? darkSurfaceBackground : surfaceBackground,
  );

  const parentOrShadowHost = (element: Element): Element | null => {
    if (element.parentElement) return element.parentElement;
    const currentRoot = element.getRootNode();
    return currentRoot instanceof ShadowRoot ? currentRoot.host : null;
  };

  const explicitMode = (): 'dark' | 'light' | 'system' | undefined => {
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
    syncFallbackTheme?.(darkMode);
  };

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

  const ensureComponentStyles = () => {
    if (!root) return;
    const rootNode = root.getRootNode();
    const target = rootNode instanceof ShadowRoot ? rootNode : document.head;
    const styleId = 'jsonforms-monaco-editor-styles';
    if (target.querySelector(`#${styleId}`)) return;

    const style = document.createElement('style');
    style.id = styleId;
    // Monaco's stylesheet is normally emitted globally. Global styles cannot
    // cross a custom element's shadow boundary, so install both stylesheets in
    // the component root. The id guard keeps this to one copy per document or
    // shadow root even when a form contains several editors.
    style.textContent = `${monacoStyles}\n${monacoEditorStyles}`;
    target.appendChild(style);
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

  $effect(() => {
    const nextValue = value;
    if (editor && editor.getValue() !== nextValue) editor.setValue(nextValue);
  });

  $effect(() => {
    const nextLanguage = language;
    if (!editor || !monaco) return;
    const model = editor.getModel();
    if (model) monaco.editor.setModelLanguage(model, nextLanguage);
  });

  $effect(() => {
    const nextOptions = {
      placeholder: placeholder || undefined,
      ...options,
      readOnly: readonly || disabled || options.readOnly === true,
      domReadOnly: disabled || options.domReadOnly === true,
    };
    editor?.updateOptions(nextOptions);
  });

  $effect(() => {
    // Track geometry before scheduling Monaco layout after the DOM update.
    void editorHeight;
    void tick().then(() => editor?.layout());
  });

  onMount(() => {
    contentRows = rows;
    ensureComponentStyles();
    const setup = async () => {
      const api = await import('./monaco-api.js');
      if (disposed || !container || !root) return;
      monaco = api.monaco;
      syncFallbackTheme = api.syncMonacoFallbackTheme;
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
      schemaRegistration = createMonacoSchemaRegistration(
        monaco.json.jsonDefaults,
        editor.getModel()!.uri.toString(),
      );
      syncSchemaRegistration();
      changeSubscription = editor.onDidChangeModelContent(() => {
        updateContentRows();
        onvaluechange?.(editor!.getValue());
      });
      const publishMarkers = () => {
        const model = editor?.getModel();
        if (!model || !monaco || disposed) return;
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
      for (const actionId of initActions) {
        if (disposed) return;
        try {
          await editor.getAction(actionId)?.run();
        } catch (error) {
          if (!disposed || !(error instanceof Error) || error.name !== 'Canceled') throw error;
        }
      }
    };
    void setup()
      .then(() => {
        if (!disposed) loading = false;
      })
      .catch((error: unknown) => {
        if (disposed) return;
        disposeEditor();
        loading = false;
        failed = true;
        console.warn('[jsonforms] editor.loadError', error);
      });
  });

  const disposeEditor = () => {
    disposed = true;
    if (typeof window !== 'undefined') window.removeEventListener('keydown', handleKeydown);
    mediaQuery?.removeEventListener('change', syncTheme);
    themeObserver?.disconnect();
    resizeObserver?.disconnect();
    markerSubscription?.dispose();
    changeSubscription?.dispose();
    focusSubscription?.dispose();
    blurSubscription?.dispose();
    const ownedModel = editor?.getModel();
    editor?.setModel(null);
    editor?.dispose();
    editor = undefined;
    schemaRegistration?.clear();
    if (ownedModel) {
      // Monaco 0.55's completion adapter can probe a word range after its
      // cancellation token was cancelled. Guard only this disposed owned model;
      // active editing and host-owned models keep Monaco's original behavior.
      const getWordUntilPosition = ownedModel.getWordUntilPosition.bind(ownedModel);
      ownedModel.getWordUntilPosition = (position) =>
        ownedModel.isDisposed()
          ? { word: '', startColumn: position.column, endColumn: position.column }
          : getWordUntilPosition(position);
      ownedModel.dispose();
    }
    syncFallbackTheme = undefined;
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
  style={`--jsonforms-monaco-height: ${editorHeight}; ${resolvedSurfaceBackground ? `--jsonforms-monaco-surface-background: ${resolvedSurfaceBackground};` : ''} ${rest.style ?? ''}`}
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
