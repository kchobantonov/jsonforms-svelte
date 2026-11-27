import type { StateProps } from '@jsonforms/examples';
import { onDestroy, untrack } from 'svelte';
import type { ErrorObject } from 'ajv';
import cloneDeep from 'lodash/cloneDeep';
import {
  createAjv,
  type JsonFormsProps,
  type ActionEvent,
} from '@chobantonov/jsonforms-svelte-extended';
import type { JsonFormsValidityEvent } from '@chobantonov/jsonforms-svelte-renderer-common';
import { useExampleEditors } from './exampleEditors.svelte';
import { createDemoTranslator } from '../i18n/demo';
import { createTranslator } from '../i18n/i18n';
import { mergeDemoConfig } from '../demoConfig';
import { useDemoServerErrors } from '../examples/server-errors.svelte';
import { resolveDemoHostAction } from '../examples/hostActions';
import type { DemoExample } from '../examples/definitions';
import type { createDemoBaseStore } from '../store/index.svelte';

interface ExamplePageOptions {
  readonly name?: string;
  notify?(message: string): void;
  readonly retainEditorModels?: boolean;
  readonly externalPlayground: boolean;
  readonly renderers: JsonFormsProps['renderers'];
  readonly cells: JsonFormsProps['cells'];
}

export function useExamplePage(
  appStore: ReturnType<typeof createDemoBaseStore> & {
    mode: { value: 'light' | 'dark' | 'system' };
  },
  examples: DemoExample[],
  binding: ExamplePageOptions,
) {
  const translateDemo = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  // This cache is read on example navigation, not as reactive UI state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const exampleDataCache = new Map<string, unknown>();

  const currentExample = $derived.by(
    () => examples.find((example) => example.name === binding.name) as DemoExample | undefined,
  );

  const initialState = (example: DemoExample): JsonFormsProps => {
    const state: JsonFormsProps = {
      schema: example.schema,
      uischema: example.uischema,
      data: exampleDataCache.has(example.name)
        ? cloneDeep(exampleDataCache.get(example.name))
        : example.data,
      config: example.config,
      uischemas: example.uischemas,
      i18n: example.i18n,
      renderers: [...binding.renderers],
      cells: [...(binding.cells ?? [])],
      readonly: appStore.jsonforms.readonly.value,
      validationMode: appStore.jsonforms.validationMode,
    } as JsonFormsProps;
    state.ajv = createAjv(
      example.i18n,
      () => mergeDemoConfig(state.config, appStore.jsonforms.config),
      example.externalSchemas,
      example.validatorDialect,
    );
    return state;
  };

  type JsonObject = Record<string, unknown>;

  const tabValues = {
    demo: 'demo',
    schema: 'schema',
    uiSchema: 'uiSchema',
    uiSchemas: 'uiSchemas',
    internationalization: 'internationalization',
    config: 'config',
    external: 'external',
    data: 'data',
  } as const;

  const getTranslations = (i18n: JsonFormsProps['i18n'] | undefined): JsonObject | undefined =>
    (i18n as (DemoExample['i18n'] & { translations?: JsonObject }) | undefined)?.translations;

  const buildDemoI18n = (translations: JsonObject | undefined): DemoExample['i18n'] | undefined => {
    if (!translations) {
      return undefined;
    }

    const locale = effectiveFormLocale;

    return {
      locale,
      translate: createTranslator(locale, translations),
      translations,
    };
  };

  let jsonFormsProps = $state<JsonFormsProps | undefined>(undefined);
  let playgroundExternal = $state<Record<string, unknown>>({ settings: {} });
  let externalModel = $state('');
  const playgroundSettings = $derived(playgroundExternal.settings);
  let errors = $state<ErrorObject[]>([]);
  let schemaErrorCount = $state(0);
  let additionalErrorCount = $state(0);
  let validityPending = $state(false);
  let toastVisible = $state(false);
  let toastText = $state('');
  let activeTab = $state<string>(tabValues.demo);

  $effect(() => {
    const requested = String(appStore.activeTab.value ?? tabValues.demo);
    activeTab = visibleTabs.includes(requested) ? requested : tabValues.demo;
  });
  let loadedExampleName = $state<string | undefined>(undefined);
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;
  let formModeOverride = $state<'light' | 'dark' | undefined>(undefined);
  let formLocaleOverride = $state<string | undefined>(undefined);

  $effect(() => {
    if (loadedExampleName && jsonFormsProps) {
      exampleDataCache.set(loadedExampleName, cloneDeep(jsonFormsProps.data));
    }
  });

  const demoTabLabel = $derived.by(() =>
    appStore.layout.value === 'demo-and-data'
      ? translateDemo('settings.demoAndData')
      : translateDemo('editor.demo.label'),
  );
  const activeTranslations = $derived.by(() => getTranslations(jsonFormsProps?.i18n));
  const editors = useExampleEditors(examples, {
    get example() {
      return currentExample;
    },
    get form() {
      return jsonFormsProps;
    },
    get config() {
      return appStore.jsonforms.config;
    },
    get translate() {
      return translateDemo;
    },
    buildI18n: buildDemoI18n,
    notify: binding.notify ?? notify,
  });
  const serverErrors = useDemoServerErrors({
    get example() {
      return currentExample?.name;
    },
    get data() {
      return jsonFormsProps?.data;
    },
    get translate() {
      return jsonFormsProps?.i18n?.translate;
    },
  });
  const showPlaygroundConfiguration = $derived.by(
    () => appStore.formOnly.value || activeTab === tabValues.demo,
  );
  const hasPlayground = $derived.by(
    () => binding.externalPlayground && Boolean(currentExample?.configuration),
  );
  const hasDynamicPlayground = $derived.by(
    () => hasPlayground && currentExample!.name.startsWith('spec-dynamic-'),
  );
  const jsonFormsPropsForRender = $derived.by<JsonFormsProps | undefined>(() => {
    if (!jsonFormsProps) {
      return undefined;
    }

    return {
      ...jsonFormsProps,
      ...(hasDynamicPlayground ? { external: playgroundExternal } : {}),
      additionalErrors: [...(jsonFormsProps.additionalErrors ?? []), ...serverErrors.errors],
      config: mergeDemoConfig(jsonFormsProps.config, appStore.jsonforms.config),
    };
  });
  $effect(() => {
    appStore.jsonforms.exampleConfig = jsonFormsProps?.config ?? {};
  });
  const visibleTabs = $derived.by<string[]>(() => {
    const tabs: string[] = [
      tabValues.demo,
      tabValues.schema,
      tabValues.uiSchema,
      tabValues.uiSchemas,
      tabValues.internationalization,
      tabValues.config,
    ];

    if (hasPlayground) tabs.push(tabValues.external);
    if (appStore.layout.value !== 'demo-and-data') {
      tabs.push(tabValues.data);
    }

    return tabs;
  });
  const isCurrentExampleLoaded = $derived.by(
    () =>
      currentExample !== undefined &&
      jsonFormsProps !== undefined &&
      loadedExampleName === currentExample.name,
  );
  const shouldUseWebComponentView = $derived(appStore.useWebComponentView.value);
  const effectiveFormMode = $derived.by(() => formModeOverride ?? appStore.mode.value);
  const effectiveFormLocale = $derived.by(
    () => formLocaleOverride ?? appStore.jsonforms.locale.value,
  );
  const formContext = $derived({
    appStore,
    getFormModeOverride: () => formModeOverride,
    setFormModeOverride: (mode: 'light' | 'dark') => {
      formModeOverride = mode;
    },
  });

  function loadPlayground(example: DemoExample) {
    if (binding.externalPlayground) {
      playgroundExternal = {
        settings: example.configuration ? structuredClone(example.configuration.data) : {},
      };
      externalModel = JSON.stringify(playgroundExternal, null, 2);
    }
  }

  function restoreActiveTab() {
    const storedActiveTab = untrack(() => String(appStore.activeTab.value ?? tabValues.demo));
    activeTab = visibleTabs.includes(storedActiveTab) ? storedActiveTab : tabValues.demo;
    if (appStore.activeTab.value !== activeTab) appStore.activeTab.value = activeTab;
  }

  $effect(() => {
    const example = currentExample;
    const exampleName = example?.name;

    if (exampleName === loadedExampleName) {
      return;
    }

    if (example) {
      jsonFormsProps = initialState(example);
      loadPlayground(example);
      editors.load(example);
      errors = [];
      schemaErrorCount = 0;
      additionalErrorCount = 0;
      validityPending = false;
      toastVisible = false;
      toastText = '';
      formModeOverride = undefined;
      formLocaleOverride = undefined;
      loadedExampleName = exampleName;

      restoreActiveTab();
    } else {
      jsonFormsProps = undefined;
      editors.reset(!binding.retainEditorModels);
      errors = [];
      schemaErrorCount = 0;
      additionalErrorCount = 0;
      validityPending = false;
      toastVisible = false;
      toastText = '';
      formModeOverride = undefined;
      formLocaleOverride = undefined;
      loadedExampleName = undefined;
    }
  });

  $effect(() => {
    void appStore.jsonforms.readonly.value;

    if (jsonFormsProps) {
      jsonFormsProps.readonly = appStore.jsonforms.readonly.value;
    }
  });

  $effect(() => {
    void appStore.jsonforms.validationMode;

    if (jsonFormsProps) {
      jsonFormsProps.validationMode = appStore.jsonforms.validationMode;
    }
  });

  $effect(() => {
    const locale = effectiveFormLocale;
    const translations = activeTranslations;

    if (jsonFormsProps && translations && jsonFormsProps.i18n?.locale !== locale) {
      const nextI18n = buildDemoI18n(translations);
      jsonFormsProps.i18n = nextI18n;
      jsonFormsProps.ajv = createAjv(
        nextI18n,
        () => mergeDemoConfig(jsonFormsProps?.config, appStore.jsonforms.config),
        currentExample?.externalSchemas,
        currentExample?.validatorDialect,
      );
    }
  });

  $effect(() => {
    if (!visibleTabs.includes(activeTab)) {
      setActiveTab(tabValues.demo);
    }
  });

  function onChange(event: { data: unknown }) {
    if (jsonFormsProps) {
      jsonFormsProps.data = event.data;
    }
    editors.syncData(event.data);
  }

  function onValidityChange(event: JsonFormsValidityEvent) {
    errors = [...event.errors, ...event.additionalErrors];
    schemaErrorCount = event.errors.length;
    additionalErrorCount = event.additionalErrors.length;
    validityPending = event.pending;
  }

  async function onHandleAction(event: ActionEvent) {
    serverErrors.handle(event);
    await currentExample?.onHandleAction?.(event);
    event.callback ??= resolveDemoHostAction(event.action, event.params, {
      setLocale: (locale) => (formLocaleOverride = locale),
      toggleMode: () =>
        (formModeOverride =
          effectiveFormMode === 'dark' ||
          (effectiveFormMode === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
            ? 'light'
            : 'dark'),
    });
  }

  function notify(message: string, duration = 3000) {
    toastText = message;
    toastVisible = true;

    if (toastTimeout) clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
      toastVisible = false;
      toastTimeout = null;
    }, duration);
  }

  function setActiveTab(value: string) {
    activeTab = value;
    appStore.activeTab.value = value;
  }

  onDestroy(() => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
  });
  const formEvents = {
    onchange: onChange,
    onvaliditychange: onValidityChange,
    onhandleaction: onHandleAction,
  };
  const externalEditorProps = $derived({
    label: translateDemo('editor.external.label'),
    reloadLabel: translateDemo('editor.external.reload'),
    applyLabel: translateDemo('editor.external.apply'),
    hint: translateDemo('editor.external.hint'),
    invalid: translateDemo('editor.external.invalid'),
    onchange(value: Record<string, unknown>) {
      playgroundExternal = value;
    },
  });
  const webFormProps = $derived.by(() => {
    const form = jsonFormsPropsForRender;
    if (!form) return {};
    return {
      data: form.data,
      schema: form.schema,
      ajv: form.ajv,
      uischema: form.uischema,
      uischemas: form.uischemas,
      config: form.config,
      readonly: form.readonly,
      validationMode: form.validationMode,
      additionalErrors: form.additionalErrors,
      locale: effectiveFormLocale,
      mode: effectiveFormMode,
      translations: activeTranslations,
      ...formEvents,
    };
  });
  return {
    formEvents,
    nativeFormProps(form: JsonFormsProps) {
      return { ...form, ...formEvents, context: formContext };
    },
    get previewProps() {
      return {
        split: appStore.layout.value === 'demo-and-data',
        locale: appStore.jsonforms.locale.value,
        overflow: appStore.useWebComponentView.value,
        webComponent: shouldUseWebComponentView,
        mode: formModeOverride,
        active: activeTab === tabValues.demo,
        translate: translateDemo,
        editors,
      };
    },
    get playgroundConfiguration() {
      return hasDynamicPlayground && showPlaygroundConfiguration
        ? currentExample!.configuration
        : undefined;
    },
    get webFormProps() {
      return webFormProps;
    },
    get externalEditorProps() {
      return externalEditorProps;
    },
    applyExampleAction(action: NonNullable<DemoExample['actions']>[number]) {
      if (jsonFormsProps) jsonFormsProps = action.apply(jsonFormsProps as StateProps);
    },
    reloadExternal() {
      if (currentExample?.configuration)
        externalModel = JSON.stringify(
          { settings: structuredClone(currentExample.configuration.data) },
          null,
          2,
        );
    },
    get formModeOverride() {
      return formModeOverride;
    },
    get activeTranslations() {
      return activeTranslations;
    },
    get activeTab() {
      return activeTab;
    },
    get additionalErrorCount() {
      return additionalErrorCount;
    },
    get currentExample() {
      return currentExample;
    },
    get demoTabLabel() {
      return demoTabLabel;
    },
    editors,
    get effectiveFormLocale() {
      return effectiveFormLocale;
    },
    get effectiveFormMode() {
      return effectiveFormMode;
    },
    get errors() {
      return errors;
    },
    get externalModel() {
      return externalModel;
    },
    get formContext() {
      return formContext;
    },
    get isCurrentExampleLoaded() {
      return isCurrentExampleLoaded;
    },
    get jsonFormsProps() {
      return jsonFormsProps;
    },
    get jsonFormsPropsForRender() {
      return jsonFormsPropsForRender;
    },
    onChange,
    onHandleAction,
    onValidityChange,
    get playgroundExternal() {
      return playgroundExternal;
    },
    get playgroundSettings() {
      return playgroundSettings;
    },
    get schemaErrorCount() {
      return schemaErrorCount;
    },
    setActiveTab,
    get shouldUseWebComponentView() {
      return shouldUseWebComponentView;
    },
    tabValues,
    get toastText() {
      return toastText;
    },
    get toastVisible() {
      return toastVisible;
    },
    get validityPending() {
      return validityPending;
    },
    set externalModel(value: string) {
      externalModel = value;
    },
    set jsonFormsProps(value: JsonFormsProps | undefined) {
      jsonFormsProps = value;
    },
    set playgroundExternal(value: Record<string, unknown>) {
      playgroundExternal = value;
    },
  };
}
