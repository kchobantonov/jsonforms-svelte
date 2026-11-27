<script lang="ts">
  import { ExternalEditor } from '@chobantonov/jsonforms-svelte-demo-common';
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { SplitPane, Pane } from '@chobantonov/jsonforms-svelte-flowbite';
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
    createFlowbiteDemoExamples,
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
    defaultStyles,
    flowbiteCells,
    flowbiteRenderers,
    mergeStyles,
    StylesContextSymbol,
    ValidationIcon,
  } from '@chobantonov/jsonforms-svelte-flowbite';
  import {
    flowbiteExtendedCells,
    flowbiteExtendedRenderers,
  } from '@chobantonov/jsonforms-svelte-flowbite-extended';
  import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
  import type { StateProps } from '@jsonforms/examples';
  import type { ErrorObject } from 'ajv';
  import {
    Button,
    Card,
    Heading,
    Hr,
    TabItem,
    Tabs,
    Toast,
    ToolbarButton,
    Tooltip,
  } from 'flowbite-svelte';
  import { FloppyDiskOutline, InfoCircleOutline, UndoOutline } from 'flowbite-svelte-icons';
  import cloneDeep from 'lodash/cloneDeep';
  import { setContext } from 'svelte';

  const appStore = useAppStore();
  const translateDemo = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  const examples = createFlowbiteDemoExamples(() => appStore.jsonforms.locale.value);
  const currentExample = $derived.by(
    () => examples.find((example) => example.name === page.params.name) as DemoExample | undefined,
  );

  const renderers: JsonFormsRendererRegistryEntry[] = [
    ...flowbiteRenderers,
    ...flowbiteExtendedRenderers,
  ];
  const cells = [...flowbiteCells, ...flowbiteExtendedCells];
  // This cache is read on example navigation, not as reactive UI state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const exampleDataCache = new Map<string, unknown>();

  const initialState = (
    example: DemoExample,
    cells: JsonFormsProps['cells'],
    nextRenderers: JsonFormsProps['renderers'],
  ): JsonFormsProps => {
    const state = {
      schema: example.schema,
      uischema: example.uischema,
      data: exampleDataCache.has(example.name)
        ? cloneDeep(exampleDataCache.get(example.name))
        : example.data,
      config: example.config,
      uischemas: example.uischemas,
      cells,
      renderers: nextRenderers,
      i18n: example.i18n,
      additionalErrors: undefined,
      middleware: undefined,
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
  type Action = NonNullable<DemoExample['actions']>[number];

  const tabKeys = {
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
  let errors = $state<ErrorObject<string, Record<string, unknown>, unknown>[]>([]);
  let schemaErrorCount = $state(0);
  let additionalErrorCount = $state(0);
  let validityPending = $state(false);

  let loadedExampleName = $state<string | undefined>(undefined);
  let formModeOverride = $state<'light' | 'dark' | undefined>(undefined);
  let formLocaleOverride = $state<string | undefined>(undefined);

  $effect(() => {
    if (loadedExampleName && jsonFormsProps) {
      exampleDataCache.set(loadedExampleName, cloneDeep(jsonFormsProps.data));
    }
  });

  let snackbar = $state(false);
  let snackbarText = $state('');
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  const webComponentThemeStyle = $derived(getWebComponentThemeStyle(appStore.themeColor.value));
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
    notify: toast,
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
      tabKeys.demo,
      tabKeys.schema,
      tabKeys.uiSchema,
      tabKeys.uiSchemas,
      tabKeys.internationalization,
      tabKeys.config,
    ];

    if (currentExample?.configuration) tabs.push(tabKeys.external);
    if (appStore.layout.value !== 'demo-and-data') {
      tabs.push(tabKeys.data);
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

  const myStyles = mergeStyles(defaultStyles, {
    control: { root: 'my-control' },
  });

  setContext(StylesContextSymbol, myStyles);

  $effect(() => {
    const example = currentExample;
    const exampleName = example?.name;

    if (exampleName === loadedExampleName) {
      return;
    }

    if (example) {
      jsonFormsProps = initialState(example, cells, renderers);
      playgroundExternal = {
        settings: example.configuration ? structuredClone(example.configuration.data) : {},
      };
      externalModel = JSON.stringify(playgroundExternal, null, 2);
      editors.load(example);
      errors = [];
      schemaErrorCount = 0;
      additionalErrorCount = 0;
      validityPending = false;
      formModeOverride = undefined;
      formLocaleOverride = undefined;
      loadedExampleName = exampleName;
    } else {
      jsonFormsProps = undefined;
      editors.reset(false);
      errors = [];
      schemaErrorCount = 0;
      additionalErrorCount = 0;
      validityPending = false;
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
    if (!visibleTabs.includes(String(appStore.activeTab.value))) {
      appStore.activeTab.value = tabKeys.demo;
    }
  });

  const onChange = (event: JsonFormsChangeEvent) => {
    if (jsonFormsProps) {
      jsonFormsProps.data = event.data;
    }
    editors.syncData(event.data);
  };

  function onValidityChange(event: JsonFormsValidityEvent) {
    errors = [...event.errors, ...event.additionalErrors];
    schemaErrorCount = event.errors.length;
    additionalErrorCount = event.additionalErrors.length;
    validityPending = event.pending;
  }

  const onHandleAction = async (event: ActionEvent) => {
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
  };

  const handleAction = (action: Action) => {
    if (jsonFormsProps) {
      jsonFormsProps = action.apply(jsonFormsProps as StateProps);
    }
  };

  function toast(message: string, duration = 3000) {
    snackbarText = message;
    snackbar = true;

    if (toastTimeout) clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
      snackbar = false;
      toastTimeout = null;
    }, duration);
  }
</script>

<svelte:head>
  <title>{translateDemo('example.pageTitle', undefined, { library: 'Flowbite' })}</title>
  <meta
    name="description"
    content={translateDemo('example.pageTitle', undefined, { library: 'Flowbite' })}
  />
</svelte:head>

{#if currentExample === undefined}
  <div class="p-4 text-center">
    <Heading tag="h1" class="text-2xl font-bold text-red-600 dark:text-red-400">
      {translateDemo('example.notFound', undefined, { name: page.params.name })}
    </Heading>
  </div>
{:else if !isCurrentExampleLoaded}
  <div class="p-4"></div>
{:else}
  <div
    class={currentExample.name.startsWith('spec-dynamic-') &&
    currentExample.configuration &&
    (appStore.formOnly.value || appStore.activeTab.value === tabKeys.demo)
      ? 'grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]'
      : ''}
  >
    {#if !appStore.formOnly.value}
      <Card class="min-w-full p-4 sm:p-6 md:p-8">
        <Heading tag="h5" class="mb-4 text-2xl font-bold tracking-tight ">
          {currentExample.label}
        </Heading>
        <div class="text-gray-900 dark:text-gray-200">
          <SpecSourceLink spec={currentExample.spec} locale={appStore.jsonforms.locale.value} />
        </div>

        <Tabs tabStyle="underline" selected={appStore.activeTab.value}>
          <TabItem key={tabKeys.demo} onclick={() => (appStore.activeTab.value = tabKeys.demo)}>
            {#snippet titleSlot()}
              <div class="flex items-center gap-2">
                {appStore.layout.value === 'demo-and-data'
                  ? translateDemo('settings.demoAndData')
                  : translateDemo('editor.demo.label')}
                {#if errors}
                  <ValidationIcon {errors} data-testid="form-validation-errors" />
                {/if}
                {#if schemaErrorCount > 0 || additionalErrorCount > 0}
                  <span class="text-xs opacity-70" data-testid="form-validation-breakdown">
                    {#if schemaErrorCount > 0}{translateDemo('validation.schemaCount', undefined, {
                        count: schemaErrorCount,
                      })}{/if}
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
              </div>
            {/snippet}

            <div class="flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold">JSON Forms</Heading>
              {#if currentExample.actions}
                <div class="flex gap-2">
                  {#each currentExample.actions as action, index (index)}
                    <Button onclick={() => handleAction(action)}>
                      {action.label}
                    </Button>
                  {/each}
                </div>
              {/if}
            </div>

            <Hr class="my-4" />

            {#if appStore.layout.value === 'demo-and-data'}
              <div class="min-h-0 min-w-0">
                <SplitPane
                  initialSizes={[75, 25]}
                  minSize={200}
                  resizeLabel={rendererMessage(
                    appStore.jsonforms.locale.value,
                    'splitLayout.resize',
                  )}
                >
                  <Pane class="pe-4">
                    <div class="pointer-events-auto select-text">
                      <div class="mb-4 flex items-center justify-between">
                        <Heading tag="h6" class="text-lg font-semibold"
                          >{translateDemo('editor.demo.label')}</Heading
                        >
                      </div>
                      <Hr class="my-4" />
                      <div class="json-forms">
                        {#if jsonFormsPropsForRender}
                          {#if shouldUseWebComponentView}
                            <JsonFormsWebComponentWrapper
                              {...jsonFormsPropsForRender}
                              locale={effectiveFormLocale}
                              mode={effectiveFormMode}
                              translations={activeTranslations}
                              customStyle={webComponentThemeStyle}
                              onchange={onChange}
                              onvaliditychange={onValidityChange}
                              onhandleaction={onHandleAction}
                            />
                          {:else}
                            <div
                              class="rounded-xl bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-200"
                              class:light={formModeOverride === 'light'}
                              class:dark={formModeOverride === 'dark'}
                            >
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
                      <div class="mb-4 flex items-center justify-between">
                        <Heading class="text-lg font-semibold"
                          >{translateDemo('editor.data.label')}</Heading
                        >
                        <div class="flex gap-2">
                          <ToolbarButton
                            size="sm"
                            onclick={() => editors.reload('data')}
                            aria-label={translateDemo('editor.data.reload')}
                            ><UndoOutline class="h-5 w-5" /></ToolbarButton
                          >
                          <Tooltip>{translateDemo('editor.data.reload')}</Tooltip>
                          <ToolbarButton
                            size="sm"
                            onclick={() => editors.apply('data')}
                            aria-label={translateDemo('editor.data.apply')}
                            ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                          >
                          <Tooltip>{translateDemo('editor.data.apply')}</Tooltip>
                        </div>
                      </div>
                      <Hr class="my-4" />
                      <MonacoEditor
                        language="json"
                        bind:value={editors.models.data}
                        style="height: calc(100vh - 200px)"
                        editorBeforeMount={editors.registerValidations}
                      ></MonacoEditor>
                    </div>
                  </Pane>
                </SplitPane>
              </div>
            {:else}
              <div class="json-forms">
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
                      translations={activeTranslations}
                      additionalErrors={jsonFormsPropsForRender.additionalErrors}
                      externalSchemas={currentExample.externalSchemas}
                      customStyle={webComponentThemeStyle}
                      onchange={onChange}
                      onvaliditychange={onValidityChange}
                      onhandleaction={onHandleAction}
                    />
                  {:else}
                    <div
                      class="rounded-xl bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-200"
                      class:light={formModeOverride === 'light'}
                      class:dark={formModeOverride === 'dark'}
                    >
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
            {/if}
          </TabItem>

          <div class="flex-1"></div>

          <TabItem
            key={tabKeys.schema}
            title={translateDemo('editor.schema.label')}
            onclick={() => (appStore.activeTab.value = tabKeys.schema)}
          >
            <div class="mb-4 flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold"
                >{translateDemo('editor.schema.label')}</Heading
              >
              <div class="flex gap-2">
                <ToolbarButton
                  size="sm"
                  onclick={() => editors.reload('schema')}
                  aria-label={translateDemo('editor.schema.reload')}
                  ><UndoOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>{translateDemo('editor.schema.reload')}</Tooltip>
                <ToolbarButton
                  size="sm"
                  onclick={() => editors.apply('schema')}
                  aria-label={translateDemo('editor.schema.apply')}
                  ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>{translateDemo('editor.schema.apply')}</Tooltip>
              </div>
            </div>
            <Hr class="my-4" />
            <MonacoEditor
              language="json"
              bind:value={editors.models.schema}
              style="height: calc(100vh - 100px)"
              editorBeforeMount={editors.registerValidations}
            ></MonacoEditor>
          </TabItem>

          <TabItem
            key={tabKeys.uiSchema}
            title={translateDemo('editor.uiSchema.label')}
            onclick={() => (appStore.activeTab.value = tabKeys.uiSchema)}
          >
            <div class="mb-4 flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold"
                >{translateDemo('editor.uiSchema.label')}</Heading
              >
              <div class="flex gap-2">
                <ToolbarButton
                  size="sm"
                  onclick={() => editors.reload('uischema')}
                  aria-label={translateDemo('editor.uiSchema.reload')}
                  ><UndoOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>{translateDemo('editor.uiSchema.reload')}</Tooltip>
                <ToolbarButton
                  size="sm"
                  onclick={() => editors.apply('uischema')}
                  aria-label={translateDemo('editor.uiSchema.apply')}
                  ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>{translateDemo('editor.uiSchema.apply')}</Tooltip>
              </div>
            </div>
            <Hr class="my-4" />
            <MonacoEditor
              language="json"
              bind:value={editors.models.uischema}
              style="height: calc(100vh - 100px)"
              editorBeforeMount={editors.registerValidations}
            ></MonacoEditor>
          </TabItem>

          <TabItem
            key={tabKeys.uiSchemas}
            title={translateDemo('editor.uiSchemas.label')}
            onclick={() => (appStore.activeTab.value = tabKeys.uiSchemas)}
          >
            <div class="mb-4 flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold"
                >{translateDemo('editor.uiSchemas.label')}</Heading
              >
              <div class="flex gap-2">
                <ToolbarButton
                  size="sm"
                  onclick={() => editors.reload('uischemas')}
                  aria-label={translateDemo('editor.uiSchemas.reload')}
                  ><UndoOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>{translateDemo('editor.uiSchemas.reload')}</Tooltip>
                <ToolbarButton
                  size="sm"
                  onclick={() => editors.apply('uischemas')}
                  aria-label={translateDemo('editor.uiSchemas.apply')}
                  ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>{translateDemo('editor.uiSchemas.apply')}</Tooltip>
              </div>
            </div>
            <Hr class="my-4" />
            <MonacoEditor
              language="json"
              bind:value={editors.models.uischemas}
              style="height: calc(100vh - 100px)"
              editorBeforeMount={editors.registerValidations}
            ></MonacoEditor>
          </TabItem>

          <TabItem
            key={tabKeys.internationalization}
            title={translateDemo('editor.i18n.label')}
            onclick={() => (appStore.activeTab.value = tabKeys.internationalization)}
          >
            <div class="mb-4 flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold"
                >{translateDemo('editor.i18n.label')}</Heading
              >
              <div class="flex gap-2">
                <ToolbarButton
                  size="sm"
                  onclick={() => editors.reload('i18n')}
                  aria-label={translateDemo('editor.i18n.reload')}
                  ><UndoOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>{translateDemo('editor.i18n.reload')}</Tooltip>
                <ToolbarButton
                  size="sm"
                  onclick={() => editors.apply('i18n')}
                  aria-label={translateDemo('editor.i18n.apply')}
                  ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>{translateDemo('editor.i18n.apply')}</Tooltip>
              </div>
            </div>
            <Hr class="my-4" />
            <MonacoEditor
              language="json"
              bind:value={editors.models.i18n}
              style="height: calc(100vh - 100px)"
              editorBeforeMount={editors.registerValidations}
            ></MonacoEditor>
          </TabItem>

          <TabItem
            key={tabKeys.config}
            title={translateDemo('editor.config.label')}
            onclick={() => (appStore.activeTab.value = tabKeys.config)}
          >
            <div class="mb-4 flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold"
                >{translateDemo('editor.config.label')}</Heading
              >
              <div class="flex gap-2">
                <ToolbarButton
                  size="sm"
                  onclick={() => editors.reload('config')}
                  aria-label={translateDemo('editor.config.reload')}
                  ><UndoOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>{translateDemo('editor.config.reload')}</Tooltip>
                <ToolbarButton
                  size="sm"
                  onclick={() => editors.apply('config')}
                  aria-label={translateDemo('editor.config.apply')}
                  ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>{translateDemo('editor.config.apply')}</Tooltip>
              </div>
            </div>
            <Hr class="my-4" />
            <MonacoEditor
              language="json"
              bind:value={editors.models.config}
              style="height: calc(100vh - 100px)"
              editorBeforeMount={editors.registerValidations}
            ></MonacoEditor>
          </TabItem>

          {#if currentExample.configuration}
            <TabItem
              key={tabKeys.external}
              title={translateDemo('editor.external.label')}
              onclick={() => (appStore.activeTab.value = tabKeys.external)}
              ><ExternalEditor
                editor={MonacoEditor}
                editorStyle="height: calc(100vh - 100px)"
                bind:value={externalModel}
                onchange={(value) => {
                  playgroundExternal = value;
                }}
                label={translateDemo('editor.external.label')}
                hint={translateDemo('editor.external.hint')}
                invalid={translateDemo('editor.external.invalid')}
              >
                {#snippet header(apply, invalidDraft)}
                  <div class="mb-4 flex items-center justify-between">
                    <Heading tag="h6" class="text-xl font-bold"
                      >{translateDemo('editor.external.label')}</Heading
                    >
                    <div class="flex gap-2">
                      <ToolbarButton
                        size="sm"
                        onclick={() => {
                          externalModel = JSON.stringify(
                            { settings: structuredClone(currentExample.configuration!.data) },
                            null,
                            2,
                          );
                        }}
                        aria-label={translateDemo('editor.external.reload')}
                        ><UndoOutline class="h-5 w-5" /></ToolbarButton
                      >
                      <Tooltip>{translateDemo('editor.external.reload')}</Tooltip>
                      <ToolbarButton
                        size="sm"
                        onclick={apply}
                        disabled={invalidDraft}
                        aria-label={translateDemo('editor.external.apply')}
                        ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                      >
                      <Tooltip>{translateDemo('editor.external.apply')}</Tooltip>
                    </div>
                  </div>
                  <Hr class="my-4" />
                {/snippet}
              </ExternalEditor></TabItem
            >
          {/if}

          {#if appStore.layout.value !== 'demo-and-data'}
            <TabItem
              key={tabKeys.data}
              title={translateDemo('editor.data.label')}
              onclick={() => (appStore.activeTab.value = tabKeys.data)}
            >
              <div class="mb-4 flex items-center justify-between">
                <Heading tag="h6" class="text-xl font-bold"
                  >{translateDemo('editor.data.label')}</Heading
                >
                <div class="flex gap-2">
                  <ToolbarButton
                    size="sm"
                    onclick={() => editors.reload('data')}
                    aria-label={translateDemo('editor.data.reload')}
                    ><UndoOutline class="h-5 w-5" /></ToolbarButton
                  >
                  <Tooltip>{translateDemo('editor.data.reload')}</Tooltip>
                  <ToolbarButton
                    size="sm"
                    onclick={() => editors.apply('data')}
                    aria-label={translateDemo('editor.data.apply')}
                    ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                  >
                  <Tooltip>{translateDemo('editor.data.apply')}</Tooltip>
                </div>
              </div>
              <Hr class="my-4" />
              <MonacoEditor
                language="json"
                bind:value={editors.models.data}
                style="height: calc(100vh - 200px)"
                editorBeforeMount={editors.registerValidations}
              ></MonacoEditor>
            </TabItem>
          {/if}
        </Tabs>
      </Card>
    {:else}
      <div class="json-forms px-2 pt-2 sm:px-0 sm:pt-0">
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
              translations={activeTranslations}
              additionalErrors={jsonFormsPropsForRender.additionalErrors}
              externalSchemas={currentExample.externalSchemas}
              customStyle={webComponentThemeStyle}
              onchange={onChange}
              onvaliditychange={onValidityChange}
              onhandleaction={onHandleAction}
            />
          {:else}
            <div
              class="rounded-xl bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-200"
              class:light={formModeOverride === 'light'}
              class:dark={formModeOverride === 'dark'}
            >
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
    {/if}
    {#if currentExample?.name.startsWith('spec-dynamic-') && currentExample.configuration && jsonFormsPropsForRender && (appStore.formOnly.value || appStore.activeTab.value === tabKeys.demo)}
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
    {#if snackbar}
      <Toast bind:toastStatus={snackbar} dismissable={true} position="top-right" class="z-50">
        <div class="flex items-center gap-2">
          <InfoCircleOutline class="text-primary-500 h-5 w-5" />
          <span>{snackbarText}</span>
        </div>
      </Toast>
    {/if}
  </div>
{/if}
