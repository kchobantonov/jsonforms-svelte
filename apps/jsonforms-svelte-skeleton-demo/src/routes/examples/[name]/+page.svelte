<script lang="ts">
  import { ExternalEditor } from '@chobantonov/jsonforms-svelte-demo-common';
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { page } from '$app/state';
  import JsonFormsWebComponentWrapper from '$lib/components/JsonFormsWebComponentWrapper.svelte';
  import MonacoEditor from '$lib/components/MonacoEditor.svelte';
  import { getWebComponentThemeStyle, useAppStore } from '$lib/store/index.svelte';
  import {
    rendererMessage,
    type JsonFormsValidityEvent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { type JsonFormsChangeEvent } from '@chobantonov/jsonforms-svelte';
  import {
    useExampleEditors,
    SpecSourceLink,
    useDemoServerErrors,
    createSkeletonDemoExamples,
    createTranslator,
    mergeDemoConfig,
    resolveDemoHostAction,
    type DemoExample,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  import {
    createAjv,
    JsonForms,
    type ActionEvent,
    type JsonFormsProps,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    Pane,
    SplitPane,
    ValidationIcon,
    skeletonCells,
    skeletonRenderers,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import {
    skeletonExtendedCells,
    skeletonExtendedRenderers,
  } from '@chobantonov/jsonforms-svelte-skeleton-extended';
  import type { StateProps } from '@jsonforms/examples';
  import { RotateCcwIcon, SaveIcon } from '@lucide/svelte';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import type { ErrorObject } from 'ajv';
  import cloneDeep from 'lodash/cloneDeep';
  import { onDestroy, untrack } from 'svelte';

  const appStore = useAppStore();
  const translateDemo = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  const examples = createSkeletonDemoExamples(() => appStore.jsonforms.locale.value);
  const webComponentThemeStyle = $derived(getWebComponentThemeStyle());
  // This cache is read on example navigation, not as reactive UI state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const exampleDataCache = new Map<string, unknown>();

  const currentExample = $derived.by(
    () => examples.find((example) => example.name === page.params.name) as DemoExample | undefined,
  );

  const initialState = (example: DemoExample): JsonFormsProps => {
    const state = {
      schema: example.schema,
      uischema: example.uischema,
      data: exampleDataCache.has(example.name)
        ? cloneDeep(exampleDataCache.get(example.name))
        : example.data,
      config: example.config,
      uischemas: example.uischemas,
      i18n: example.i18n,
      renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
      cells: [...skeletonCells, ...skeletonExtendedCells],
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

  const demoTabLabel = $derived(
    appStore.layout.value === 'demo-and-data'
      ? translateDemo('settings.demoAndData')
      : translateDemo('editor.demo.label'),
  );
  const activeTranslations = $derived(getTranslations(jsonFormsProps?.i18n));
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
    notify: notify,
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
  const jsonFormsPropsForRender = $derived.by<JsonFormsProps | undefined>(() => {
    if (!jsonFormsProps) {
      return undefined;
    }

    return {
      ...jsonFormsProps,
      ...(currentExample?.name.startsWith('spec-dynamic-') && currentExample.configuration
        ? { external: playgroundExternal }
        : {}),
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

    if (currentExample?.configuration) tabs.push(tabValues.external);
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
  const effectiveFormMode = $derived(formModeOverride ?? appStore.mode.value);
  const effectiveFormLocale = $derived(formLocaleOverride ?? appStore.jsonforms.locale.value);
  const formContext = $derived({
    appStore,
    getFormModeOverride: () => formModeOverride,
    setFormModeOverride: (mode: 'light' | 'dark') => {
      formModeOverride = mode;
    },
  });

  $effect(() => {
    const example = currentExample;
    const exampleName = example?.name;

    if (exampleName === loadedExampleName) {
      return;
    }

    if (example) {
      jsonFormsProps = initialState(example);
      playgroundExternal = {
        settings: example.configuration ? structuredClone(example.configuration.data) : {},
      };
      externalModel = JSON.stringify(playgroundExternal, null, 2);
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

      const storedActiveTab = untrack(() => String(appStore.activeTab.value ?? tabValues.demo));
      activeTab = visibleTabs.includes(storedActiveTab) ? storedActiveTab : tabValues.demo;
      if (appStore.activeTab.value !== activeTab) appStore.activeTab.value = activeTab;
    } else {
      jsonFormsProps = undefined;
      editors.reset(true);
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

  function onChange(event: JsonFormsChangeEvent) {
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
</script>

<svelte:head>
  <title>{translateDemo('example.pageTitle', undefined, { library: 'Skeleton' })}</title>
  <meta
    name="description"
    content={translateDemo('example.pageTitle', undefined, { library: 'Skeleton' })}
  />
</svelte:head>

{#if currentExample === undefined}
  <div class="card preset-tonal-error p-6">
    <p class="text-base font-medium">
      {translateDemo('example.notFound', undefined, { name: page.params.name })}
    </p>
  </div>
{:else if !isCurrentExampleLoaded}
  <div class="min-h-[12rem]"></div>
{:else}
  <div
    class={currentExample.name.startsWith('spec-dynamic-') &&
    currentExample.configuration &&
    (appStore.formOnly.value || activeTab === tabValues.demo)
      ? 'grid gap-6 py-4 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]'
      : 'space-y-6 py-4'}
    dir={appStore.rtl ? 'rtl' : 'ltr'}
  >
    {#if !appStore.formOnly.value}
      <div class="flex flex-wrap items-center justify-between gap-4 lg:col-span-2">
        <div class="space-y-1">
          <h1 class="text-surface-950-50 text-3xl font-semibold">{currentExample.label}</h1>
          <SpecSourceLink spec={currentExample.spec} locale={appStore.jsonforms.locale.value} />
        </div>
      </div>
    {/if}

    {#if appStore.formOnly.value}
      <section
        class="card preset-filled-surface-50-950 text-surface-950-50 p-6"
        class:overflow-visible={shouldUseWebComponentView}
        data-mode={formModeOverride}
      >
        {#if shouldUseWebComponentView && jsonFormsPropsForRender}
          <JsonFormsWebComponentWrapper
            data={jsonFormsPropsForRender.data}
            schema={jsonFormsPropsForRender.schema}
            ajv={jsonFormsPropsForRender.ajv}
            uischema={jsonFormsPropsForRender.uischema}
            uischemas={jsonFormsPropsForRender.uischemas}
            config={jsonFormsPropsForRender.config}
            external={jsonFormsPropsForRender.external}
            readonly={jsonFormsPropsForRender.readonly}
            validationMode={jsonFormsPropsForRender.validationMode}
            locale={effectiveFormLocale}
            mode={effectiveFormMode}
            theme={appStore.theme.value}
            translations={activeTranslations}
            additionalErrors={jsonFormsPropsForRender.additionalErrors}
            externalSchemas={currentExample.externalSchemas}
            customStyle={webComponentThemeStyle}
            onchange={onChange}
            onvaliditychange={onValidityChange}
            onhandleaction={onHandleAction}
          />
        {:else if jsonFormsPropsForRender}
          <div class="text-surface-950-50" data-mode={formModeOverride}>
            <JsonForms
              {...jsonFormsPropsForRender}
              onchange={onChange}
              onvaliditychange={onValidityChange}
              context={formContext}
              onhandleaction={onHandleAction}
            />
          </div>
        {/if}
      </section>
    {:else}
      <section
        class="card preset-outlined-surface-200-800"
        class:overflow-hidden={!appStore.useWebComponentView.value}
        class:overflow-visible={appStore.useWebComponentView.value}
      >
        {#key jsonFormsProps?.uischema}
          <Tabs
            dir={appStore.rtl ? 'rtl' : 'ltr'}
            value={activeTab}
            onValueChange={(details) => setActiveTab(details.value)}
          >
            <div class="border-surface-200-800 border-b px-5 py-5">
              <div class="overflow-x-auto overflow-y-hidden">
                <Tabs.List class="min-w-max">
                  <Tabs.Trigger value={tabValues.demo}>
                    {demoTabLabel}
                  </Tabs.Trigger>
                  <ValidationIcon {errors} data-testid="form-validation-errors" />
                  {#if schemaErrorCount > 0 || additionalErrorCount > 0}
                    <span class="text-xs opacity-70" data-testid="form-validation-breakdown">
                      {#if schemaErrorCount > 0}{translateDemo(
                          'validation.schemaCount',
                          undefined,
                          {
                            count: schemaErrorCount,
                          },
                        )}{/if}
                      {#if schemaErrorCount > 0 && additionalErrorCount > 0}
                        ·
                      {/if}
                      {#if additionalErrorCount > 0}{translateDemo(
                          'validation.additionalCount',
                          undefined,
                          { count: additionalErrorCount },
                        )}{/if}
                    </span>
                  {/if}
                  {#if validityPending}
                    <span
                      class="text-xs opacity-70"
                      data-testid="form-validation-pending"
                      role="status">{translateDemo('validation.pending')}</span
                    >
                  {/if}
                  <div class="flex-1"></div>
                  <Tabs.Trigger value={tabValues.schema}
                    >{translateDemo('editor.schema.label')}</Tabs.Trigger
                  >
                  <Tabs.Trigger value={tabValues.uiSchema}
                    >{translateDemo('editor.uiSchema.label')}</Tabs.Trigger
                  >
                  <Tabs.Trigger value={tabValues.uiSchemas}
                    >{translateDemo('editor.uiSchemas.label')}</Tabs.Trigger
                  >
                  <Tabs.Trigger value={tabValues.internationalization}>
                    {translateDemo('editor.i18n.label')}
                  </Tabs.Trigger>
                  {#if currentExample.configuration}<Tabs.Trigger value={tabValues.external}
                      >{translateDemo('editor.external.label')}</Tabs.Trigger
                    >{/if}
                  <Tabs.Trigger value={tabValues.config}
                    >{translateDemo('editor.config.label')}</Tabs.Trigger
                  >
                  {#if appStore.layout.value !== 'demo-and-data'}
                    <Tabs.Trigger value={tabValues.data}
                      >{translateDemo('editor.data.label')}</Tabs.Trigger
                    >
                  {/if}
                  <Tabs.Indicator />
                </Tabs.List>
              </div>

              <Tabs.Content
                value={tabValues.demo}
                class={`pt-5 ${appStore.useWebComponentView.value ? 'overflow-visible' : ''}`}
              >
                <div class="flex items-center justify-between gap-4">
                  <h2 class="text-xl font-bold">JSON Forms</h2>
                  {#if currentExample.actions}
                    <div class="flex flex-wrap gap-2">
                      {#each currentExample.actions as action (action.label)}
                        <button
                          type="button"
                          class="btn preset-filled"
                          onclick={() => {
                            if (jsonFormsProps) {
                              jsonFormsProps = action.apply(
                                jsonFormsProps as StateProps,
                              ) as JsonFormsProps;
                            }
                          }}
                        >
                          {action.label}
                        </button>
                      {/each}
                    </div>
                  {/if}
                </div>

                {#if appStore.layout.value === 'demo-and-data'}
                  <SplitPane
                    initialSizes={[75, 25]}
                    minSize={200}
                    resizeLabel={rendererMessage(
                      appStore.jsonforms.locale.value,
                      'splitLayout.resize',
                    )}
                    class={`mt-5 ${appStore.useWebComponentView.value ? 'overflow-visible' : ''}`}
                  >
                    <Pane
                      class={`pe-4 ${appStore.useWebComponentView.value ? 'overflow-visible' : ''}`}
                    >
                      <div class="pointer-events-auto select-text">
                        <div class="flex items-center justify-between">
                          <h3 class="text-lg font-semibold">
                            {translateDemo('editor.demo.label')}
                          </h3>
                        </div>
                        <div
                          class="card preset-filled-surface-50-950 text-surface-950-50 mt-4 p-6"
                          class:overflow-visible={shouldUseWebComponentView}
                          data-mode={formModeOverride}
                        >
                          {#if jsonFormsPropsForRender}
                            {#if shouldUseWebComponentView}
                              <JsonFormsWebComponentWrapper
                                data={jsonFormsPropsForRender.data}
                                schema={jsonFormsPropsForRender.schema}
                                ajv={jsonFormsPropsForRender.ajv}
                                uischema={jsonFormsPropsForRender.uischema}
                                uischemas={jsonFormsPropsForRender.uischemas}
                                config={jsonFormsPropsForRender.config}
                                external={jsonFormsPropsForRender.external}
                                readonly={jsonFormsPropsForRender.readonly}
                                validationMode={jsonFormsPropsForRender.validationMode}
                                locale={effectiveFormLocale}
                                mode={effectiveFormMode}
                                theme={appStore.theme.value}
                                translations={activeTranslations}
                                additionalErrors={jsonFormsPropsForRender.additionalErrors}
                                externalSchemas={currentExample.externalSchemas}
                                customStyle={webComponentThemeStyle}
                                onchange={onChange}
                                onvaliditychange={onValidityChange}
                                onhandleaction={onHandleAction}
                              />
                            {:else}
                              <div class="text-surface-950-50" data-mode={formModeOverride}>
                                <JsonForms
                                  {...jsonFormsPropsForRender}
                                  onchange={onChange}
                                  onvaliditychange={onValidityChange}
                                  context={formContext}
                                  onhandleaction={onHandleAction}
                                />
                              </div>
                            {/if}
                          {/if}
                        </div>
                      </div>
                    </Pane>

                    <Pane class="ps-4">
                      <div class="pointer-events-auto select-text">
                        <div class="flex items-center justify-between">
                          <h3 class="text-lg font-semibold">
                            {translateDemo('editor.data.label')}
                          </h3>
                          <div class="flex gap-2">
                            <button
                              type="button"
                              class="btn-icon hover:preset-tonal"
                              onclick={() => editors.reload('data')}
                              title={translateDemo('editor.data.reload')}
                            >
                              <RotateCcwIcon class="size-4" />
                            </button>
                            <button
                              type="button"
                              class="btn-icon hover:preset-tonal"
                              onclick={() => editors.apply('data')}
                              title={translateDemo('editor.data.apply')}
                            >
                              <SaveIcon class="size-4" />
                            </button>
                          </div>
                        </div>
                        <div class="card preset-outlined-surface-200-800 mt-4 overflow-hidden">
                          {#if activeTab === tabValues.demo}
                            <MonacoEditor
                              language="json"
                              bind:value={editors.models.data}
                              style="height: calc(100vh - 200px)"
                              editorBeforeMount={editors.registerValidations}
                            />
                          {/if}
                        </div>
                      </div>
                    </Pane>
                  </SplitPane>
                {:else}
                  <div class="mt-5 space-y-5">
                    <section
                      class="card preset-filled-surface-50-950 text-surface-950-50 p-6"
                      class:overflow-visible={shouldUseWebComponentView}
                      data-mode={formModeOverride}
                    >
                      {#if shouldUseWebComponentView && jsonFormsPropsForRender}
                        <JsonFormsWebComponentWrapper
                          data={jsonFormsPropsForRender.data}
                          schema={jsonFormsPropsForRender.schema}
                          ajv={jsonFormsPropsForRender.ajv}
                          uischema={jsonFormsPropsForRender.uischema}
                          uischemas={jsonFormsPropsForRender.uischemas}
                          config={jsonFormsPropsForRender.config}
                          external={jsonFormsPropsForRender.external}
                          readonly={jsonFormsPropsForRender.readonly}
                          validationMode={jsonFormsPropsForRender.validationMode}
                          locale={effectiveFormLocale}
                          mode={effectiveFormMode}
                          theme={appStore.theme.value}
                          translations={activeTranslations}
                          additionalErrors={jsonFormsPropsForRender.additionalErrors}
                          externalSchemas={currentExample.externalSchemas}
                          customStyle={webComponentThemeStyle}
                          onchange={onChange}
                          onvaliditychange={onValidityChange}
                          onhandleaction={onHandleAction}
                        />
                      {:else if jsonFormsPropsForRender}
                        <div class="text-surface-950-50" data-mode={formModeOverride}>
                          <JsonForms
                            {...jsonFormsPropsForRender}
                            onchange={onChange}
                            onvaliditychange={onValidityChange}
                            context={formContext}
                            onhandleaction={onHandleAction}
                          />
                        </div>
                      {/if}
                    </section>
                  </div>
                {/if}
              </Tabs.Content>

              <Tabs.Content value={tabValues.schema} class="pt-5">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold">{translateDemo('editor.schema.label')}</h2>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={() => editors.reload('schema')}
                        title={translateDemo('editor.schema.reload')}
                      >
                        <RotateCcwIcon class="size-4" />
                      </button>
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={() => editors.apply('schema')}
                        title={translateDemo('editor.schema.apply')}
                      >
                        <SaveIcon class="size-4" />
                      </button>
                    </div>
                  </div>
                  <div class="card preset-outlined-surface-200-800 overflow-hidden">
                    {#if activeTab === tabValues.schema}
                      <MonacoEditor
                        language="json"
                        bind:value={editors.models.schema}
                        class="h-[calc(100vh-16rem)] min-h-[480px]"
                        editorBeforeMount={editors.registerValidations}
                      />
                    {/if}
                  </div>
                </div>
              </Tabs.Content>

              <Tabs.Content value={tabValues.uiSchema} class="pt-5">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold">{translateDemo('editor.uiSchema.label')}</h2>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={() => editors.reload('uischema')}
                        title={translateDemo('editor.uiSchema.reload')}
                      >
                        <RotateCcwIcon class="size-4" />
                      </button>
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={() => editors.apply('uischema')}
                        title={translateDemo('editor.uiSchema.apply')}
                      >
                        <SaveIcon class="size-4" />
                      </button>
                    </div>
                  </div>
                  <div class="card preset-outlined-surface-200-800 overflow-hidden">
                    {#if activeTab === tabValues.uiSchema}
                      <MonacoEditor
                        language="json"
                        bind:value={editors.models.uischema}
                        class="h-[calc(100vh-16rem)] min-h-[480px]"
                        editorBeforeMount={editors.registerValidations}
                      />
                    {/if}
                  </div>
                </div>
              </Tabs.Content>

              <Tabs.Content value={tabValues.uiSchemas} class="pt-5">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold">{translateDemo('editor.uiSchemas.label')}</h2>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={() => editors.reload('uischemas')}
                        title={translateDemo('editor.uiSchemas.reload')}
                      >
                        <RotateCcwIcon class="size-4" />
                      </button>
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={() => editors.apply('uischemas')}
                        title={translateDemo('editor.uiSchemas.apply')}
                      >
                        <SaveIcon class="size-4" />
                      </button>
                    </div>
                  </div>
                  <div class="card preset-outlined-surface-200-800 overflow-hidden">
                    {#if activeTab === tabValues.uiSchemas}
                      <MonacoEditor
                        language="json"
                        bind:value={editors.models.uischemas}
                        class="h-[calc(100vh-16rem)] min-h-[480px]"
                        editorBeforeMount={editors.registerValidations}
                      />
                    {/if}
                  </div>
                </div>
              </Tabs.Content>

              <Tabs.Content value={tabValues.internationalization} class="pt-5">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold">{translateDemo('editor.i18n.label')}</h2>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={() => editors.reload('i18n')}
                        title={translateDemo('editor.i18n.reload')}
                      >
                        <RotateCcwIcon class="size-4" />
                      </button>
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={() => editors.apply('i18n')}
                        title={translateDemo('editor.i18n.apply')}
                      >
                        <SaveIcon class="size-4" />
                      </button>
                    </div>
                  </div>
                  <div class="card preset-outlined-surface-200-800 overflow-hidden">
                    {#if activeTab === tabValues.internationalization}
                      <MonacoEditor
                        language="json"
                        bind:value={editors.models.i18n}
                        class="h-[calc(100vh-16rem)] min-h-[480px]"
                        editorBeforeMount={editors.registerValidations}
                      />
                    {/if}
                  </div>
                </div>
              </Tabs.Content>

              {#if currentExample.configuration}
                <Tabs.Content value={tabValues.external} class="pt-5"
                  ><ExternalEditor
                    editor={MonacoEditor}
                    frameClass="card preset-outlined-surface-200-800 overflow-hidden"
                    editorClass="h-[calc(100vh-16rem)] min-h-[480px]"
                    bind:value={externalModel}
                    onchange={(value) => {
                      playgroundExternal = value;
                    }}
                    label={translateDemo('editor.external.label')}
                    hint={translateDemo('editor.external.hint')}
                    invalid={translateDemo('editor.external.invalid')}
                  >
                    {#snippet header(apply, invalidDraft)}
                      <div class="flex items-center justify-between">
                        <h2 class="text-xl font-bold">{translateDemo('editor.external.label')}</h2>
                        <div class="flex gap-2">
                          <button
                            type="button"
                            class="btn-icon hover:preset-tonal"
                            onclick={() => {
                              externalModel = JSON.stringify(
                                { settings: structuredClone(currentExample.configuration!.data) },
                                null,
                                2,
                              );
                            }}
                            title={translateDemo('editor.external.reload')}
                          >
                            <RotateCcwIcon class="size-4" />
                          </button>
                          <button
                            type="button"
                            class="btn-icon hover:preset-tonal"
                            onclick={apply}
                            disabled={invalidDraft}
                            title={translateDemo('editor.external.apply')}
                          >
                            <SaveIcon class="size-4" />
                          </button>
                        </div>
                      </div>
                    {/snippet}
                  </ExternalEditor></Tabs.Content
                >
              {/if}
              <Tabs.Content value={tabValues.config} class="pt-5">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold">{translateDemo('editor.config.label')}</h2>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={() => editors.reload('config')}
                        title={translateDemo('editor.config.reload')}
                      >
                        <RotateCcwIcon class="size-4" />
                      </button>
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={() => editors.apply('config')}
                        title={translateDemo('editor.config.apply')}
                      >
                        <SaveIcon class="size-4" />
                      </button>
                    </div>
                  </div>
                  <div class="card preset-outlined-surface-200-800 overflow-hidden">
                    {#if activeTab === tabValues.config}
                      <MonacoEditor
                        language="json"
                        bind:value={editors.models.config}
                        class="h-[calc(100vh-16rem)] min-h-[480px]"
                        editorBeforeMount={editors.registerValidations}
                      />
                    {/if}
                  </div>
                </div>
              </Tabs.Content>

              {#if appStore.layout.value !== 'demo-and-data'}
                <Tabs.Content value={tabValues.data} class="pt-5">
                  <div class="space-y-4">
                    <div class="flex items-center justify-between">
                      <h2 class="text-xl font-bold">{translateDemo('editor.data.label')}</h2>
                      <div class="flex gap-2">
                        <button
                          type="button"
                          class="btn-icon hover:preset-tonal"
                          onclick={() => editors.reload('data')}
                          title={translateDemo('editor.data.reload')}
                        >
                          <RotateCcwIcon class="size-4" />
                        </button>
                        <button
                          type="button"
                          class="btn-icon hover:preset-tonal"
                          onclick={() => editors.apply('data')}
                          title={translateDemo('editor.data.apply')}
                        >
                          <SaveIcon class="size-4" />
                        </button>
                      </div>
                    </div>
                    <div class="card preset-outlined-surface-200-800 overflow-hidden">
                      {#if activeTab === tabValues.data}
                        <MonacoEditor
                          language="json"
                          bind:value={editors.models.data}
                          class="h-[calc(100vh-16rem)] min-h-[480px]"
                          editorBeforeMount={editors.registerValidations}
                        />
                      {/if}
                    </div>
                  </div>
                </Tabs.Content>
              {/if}
            </div>
          </Tabs>
        {/key}
      </section>
    {/if}
    {#if currentExample?.name.startsWith('spec-dynamic-') && currentExample.configuration && jsonFormsPropsForRender && (appStore.formOnly.value || activeTab === tabValues.demo)}
      <section class="rounded-lg border p-6" data-testid="dynamic-playground-configuration">
        <h2 class="mb-4 text-lg font-semibold">{translateDemo('dynamic.configuration')}</h2>
        <JsonForms
          schema={currentExample.configuration.schema}
          uischema={currentExample.configuration.uischema}
          data={playgroundSettings}
          renderers={jsonFormsPropsForRender.renderers}
          cells={jsonFormsPropsForRender.cells}
          i18n={jsonFormsPropsForRender.i18n}
          onchange={(event) => {
            if (JSON.stringify(event.data) === JSON.stringify(playgroundExternal.settings)) return;
            playgroundExternal = { ...playgroundExternal, settings: event.data };
            externalModel = JSON.stringify(playgroundExternal, null, 2);
          }}
        />
      </section>
    {/if}
  </div>
  {#if toastVisible}
    <div class="pointer-events-none fixed top-4 right-4 z-50">
      <div
        class="rounded-container border-surface-200-800 bg-surface-50-950 border px-4 py-3 text-sm shadow-lg"
      >
        {toastText}
      </div>
    </div>
  {/if}
{/if}
