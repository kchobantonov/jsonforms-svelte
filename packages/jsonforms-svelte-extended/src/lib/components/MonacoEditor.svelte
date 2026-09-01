<script lang="ts">
  import type * as Monaco from "monaco-editor";
  import monacoStyles from "monaco-editor/min/vs/editor/editor.main.css?inline";
  import { onDestroy, onMount, tick } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import monacoEditorStyles from "./MonacoEditor.css?inline";

  type EditorOptions = Omit<
    Monaco.editor.IStandaloneEditorConstructionOptions,
    "language" | "model" | "theme" | "value"
  >;

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, "onchange"> {
    value: string;
    language?: string;
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
    onfocus?: () => void;
    onblur?: () => void;
  }

  let {
    value,
    language = "plaintext",
    disabled = false,
    readonly = false,
    invalid = false,
    autofocus = false,
    placeholder = "",
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
  const editorHeight = $derived(`${normalizedRows * 20 + 20}px`);
  const resolvedSurfaceBackground = $derived(
    darkMode && darkSurfaceBackground ? darkSurfaceBackground : surfaceBackground,
  );

  const parentOrShadowHost = (element: Element): Element | null => {
    if (element.parentElement) return element.parentElement;
    const currentRoot = element.getRootNode();
    return currentRoot instanceof ShadowRoot ? currentRoot.host : null;
  };

  const explicitMode = (): "dark" | "light" | "system" | undefined => {
    let current: Element | null = root;
    while (current) {
      const mode = current.getAttribute("data-mode");
      if (mode === "dark" || mode === "light" || mode === "system") return mode;
      if (current.classList.contains("light")) return "light";
      if (
        current.classList.contains("dark") ||
        current.classList.contains("app-dark") ||
        current.getAttribute("data-theme") === "dark"
      ) {
        return "dark";
      }
      current = parentOrShadowHost(current);
    }
    // Class-based themes such as Flowbite express light mode by removing the
    // `dark` class, so absence of that class is an explicit light selection.
    if (darkClassBasedTheme) return "light";
    return undefined;
  };

  const isDark = () => {
    const mode = explicitMode();
    if (mode === "dark") return true;
    if (mode === "light") return false;
    if (mode === "system") return mediaQuery?.matches ?? false;
    if (root) {
      // Read the surrounding application rather than this editor. The editor's
      // own light/dark class sets color-scheme and would otherwise lock the
      // fallback in its previous mode after the host changes back.
      const themeSource = parentOrShadowHost(root) ?? root;
      const colorScheme = getComputedStyle(themeSource).colorScheme.trim();
      if (colorScheme === "dark" || colorScheme.startsWith("dark "))
        return true;
      if (colorScheme === "light" || colorScheme.startsWith("light "))
        return false;
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
    const observed = new Set<Element>();
    let current: Element | null = root;
    while (current) {
      if (!observed.has(current)) {
        observed.add(current);
        themeObserver.observe(current, {
          attributes: true,
          attributeFilter: ["class", "data-mode", "data-theme", "style"],
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
    const styleId = "jsonforms-monaco-editor-styles";
    if (target.querySelector(`#${styleId}`)) return;

    const style = document.createElement("style");
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
    if (event.key === "Escape" && maximized) void toggleMaximized();
  };

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
      readOnly: readonly || disabled,
      domReadOnly: disabled,
      placeholder: placeholder || undefined,
      ...options,
    };
    editor?.updateOptions(nextOptions);
  });

  $effect(() => {
    editorHeight;
    void tick().then(() => editor?.layout());
  });

  onMount(() => {
    contentRows = rows;
    ensureComponentStyles();
    const setup = async () => {
      const api = await import("./monaco-api.js");
      if (disposed || !container || !root) return;
      monaco = api.monaco;
      syncFallbackTheme = api.syncMonacoFallbackTheme;
      api.ensureMonacoWorkers();
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      mediaQuery.addEventListener("change", syncTheme);
      observeThemeSources();

      editor = monaco.editor.create(container, {
        value,
        language,
        automaticLayout: true,
        minimap: { enabled: false },
        fontSize: 13,
        formatOnPaste: true,
        scrollBeyondLastLine: false,
        readOnly: readonly || disabled,
        domReadOnly: disabled,
        ariaLabel: rest["aria-label"] ?? undefined,
        placeholder: placeholder || undefined,
        ...options,
      });
      changeSubscription = editor.onDidChangeModelContent(() => {
        updateContentRows();
        onvaluechange?.(editor!.getValue());
      });
      focusSubscription = editor.onDidFocusEditorWidget(() => onfocus?.());
      blurSubscription = editor.onDidBlurEditorWidget(() => onblur?.());
      resizeObserver = new ResizeObserver(() => editor?.layout());
      resizeObserver.observe(root);
      updateContentRows();
      syncTheme();
      await tick();
      if (autofocus) editor.focus();
      for (const actionId of initActions)
        await editor.getAction(actionId)?.run();
      window.addEventListener("keydown", handleKeydown);
    };
    void setup();
  });

  onDestroy(() => {
    disposed = true;
    window.removeEventListener("keydown", handleKeydown);
    mediaQuery?.removeEventListener("change", syncTheme);
    themeObserver?.disconnect();
    resizeObserver?.disconnect();
    changeSubscription?.dispose();
    focusSubscription?.dispose();
    blurSubscription?.dispose();
    editor?.getModel()?.dispose();
    editor?.dispose();
    syncFallbackTheme = undefined;
  });
</script>

<div
  bind:this={root}
  {...rest}
  class={`jsonforms-monaco-editor ${disabled ? "jsonforms-monaco-editor--disabled" : ""} ${invalid ? "jsonforms-monaco-editor--invalid" : ""} ${maximized ? "jsonforms-monaco-editor--maximized" : ""} ${className ?? ""}`}
  class:jsonforms-monaco-editor--dark={darkMode}
  class:jsonforms-monaco-editor--light={!darkMode}
  class:jsonforms-monaco-editor--custom-surface={!!resolvedSurfaceBackground}
  style={`--jsonforms-monaco-height: ${editorHeight}; ${resolvedSurfaceBackground ? `--jsonforms-monaco-surface-background: ${resolvedSurfaceBackground};` : ""} ${rest.style ?? ""}`}
>
  <div bind:this={container} class="jsonforms-monaco-editor__surface"></div>
  <button
    type="button"
    class="jsonforms-monaco-editor__maximize"
    aria-label={maximized ? "Restore code editor" : "Maximize code editor"}
    title={maximized ? "Restore" : "Maximize"}
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
