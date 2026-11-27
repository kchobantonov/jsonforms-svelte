<script lang="ts">
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
    createShadcnDemoExamples,
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
    shadcnCells,
    shadcnRenderers,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import {
    shadcnExtendedCells,
    shadcnExtendedRenderers,
  } from '@chobantonov/jsonforms-svelte-shadcn-extended';
  import type { StateProps } from '@jsonforms/examples';
  import { RotateCcwIcon, SaveIcon } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Button, Tabs } from '@jsonforms-svelte-shadcn-ui';
  import type { ErrorObject } from 'ajv';
  import cloneDeep from 'lodash/cloneDeep';
  import { onDestroy, untrack } from 'svelte';

  const appStore = useAppStore();
  const translateDemo = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  const examples = createShadcnDemoExamples(() => appStore.jsonforms.locale.value);
  const webComponentThemeStyle = $derived(getWebComponentThemeStyle());
  // This cache is read on example navigation, not as reactive UI state.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const exampleDataCache = new Map<string, unknown>();

  const currentExample = $derived.by(
    () => examples.find((example) => example.name === page.params.name) as DemoExample | undefined,
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
      renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
      cells: [...shadcnCells, ...shadcnExtendedCells],
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
  <title>{translateDemo('example.pageTitle', undefined, { library: 'Shadcn' })}</title>
  <meta
    name="description"
    content={translateDemo('example.pageTitle', undefined, { library: 'Shadcn' })}
  />
</svelte:head>

{#if currentExample === undefined}
  <div class="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-6">
    <p class="text-base font-medium">
      {translateDemo('example.notFound', undefined, { name: page.params.name })}
    </p>
  </div>
{:else if !isCurrentExampleLoaded}
  <div class="min-h-[12rem]"></div>
{:else}
  <div class="space-y-6 py-4">
    {#if !appStore.formOnly.value}
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-foreground text-3xl font-semibold">{currentExample.label}</h1>
          <SpecSourceLink spec={currentExample.spec} locale={appStore.jsonforms.locale.value} />
        </div>
      </div>
    {/if}

    {#if appStore.formOnly.value}
      <section
        class="border-border bg-card text-card-foreground rounded-lg border p-6 shadow-sm"
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
            readonly={jsonFormsPropsForRender.readonly}
            validationMode={jsonFormsPropsForRender.validationMode}
            locale={effectiveFormLocale}
            mode={effectiveFormMode}
            theme={appStore.theme.value}
            designSystem={appStore.designSystem.value}
            translations={activeTranslations}
            additionalErrors={jsonFormsPropsForRender.additionalErrors}
            externalSchemas={currentExample.externalSchemas}
            customStyle={webComponentThemeStyle}
            onchange={onChange}
            onvaliditychange={onValidityChange}
            onhandleaction={onHandleAction}
          />
        {:else if jsonFormsPropsForRender}
          <div class="text-foreground" data-mode={formModeOverride}>
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
        class="border-border bg-card text-card-foreground rounded-lg border shadow-sm"
        class:overflow-hidden={!appStore.useWebComponentView.value}
        class:overflow-visible={appStore.useWebComponentView.value}
      >
        {#key jsonFormsProps?.uischema}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <div class="border-border border-b px-5 py-5">
              <div class="overflow-x-auto overflow-y-hidden pb-1">
                <Tabs.List variant="line" class="flex w-full min-w-max justify-between gap-6">
                  <div class="flex shrink-0 items-center gap-2">
                    <Tabs.Trigger class="flex-none px-3" value={tabValues.demo}>
                      {demoTabLabel}
                    </Tabs.Trigger>
                    <ValidationIcon {errors} data-testid="form-validation-errors" />
                    {#if schemaErrorCount > 0 || additionalErrorCount > 0}
                      <span
                        class="text-muted-foreground text-xs"
                        data-testid="form-validation-breakdown"
                      >
                        {#if schemaErrorCount > 0}{translateDemo(
                            'validation.schemaCount',
                            undefined,
                            { count: schemaErrorCount },
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
                        class="text-muted-foreground text-xs"
                        data-testid="form-validation-pending"
                        role="status">{translateDemo('validation.pending')}</span
                      >
                    {/if}
                  </div>
                  <div class="flex shrink-0">
                    <Tabs.Trigger class="flex-none px-3" value={tabValues.schema}
                      >{translateDemo('editor.schema.label')}</Tabs.Trigger
                    >
                    <Tabs.Trigger class="flex-none px-3" value={tabValues.uiSchema}
                      >{translateDemo('editor.uiSchema.label')}</Tabs.Trigger
                    >
                    <Tabs.Trigger class="flex-none px-3" value={tabValues.uiSchemas}
                      >{translateDemo('editor.uiSchemas.label')}</Tabs.Trigger
                    >
                    <Tabs.Trigger class="flex-none px-3" value={tabValues.internationalization}>
                      {translateDemo('editor.i18n.label')}
                    </Tabs.Trigger>
                    <Tabs.Trigger class="flex-none px-3" value={tabValues.config}
                      >{translateDemo('editor.config.label')}</Tabs.Trigger
                    >
                    {#if appStore.layout.value !== 'demo-and-data'}
                      <Tabs.Trigger class="flex-none px-3" value={tabValues.data}
                        >{translateDemo('editor.data.label')}</Tabs.Trigger
                      >
                    {/if}
                  </div>
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
                        <Button
                          onclick={() => {
                            if (jsonFormsProps) {
                              jsonFormsProps = action.apply(
                                jsonFormsProps as StateProps,
                              ) as JsonFormsProps;
                            }
                          }}
                        >
                          {action.label}
                        </Button>
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
                          class="border-border bg-card text-card-foreground mt-4 rounded-lg border p-6 shadow-sm"
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
                                readonly={jsonFormsPropsForRender.readonly}
                                validationMode={jsonFormsPropsForRender.validationMode}
                                locale={effectiveFormLocale}
                                mode={effectiveFormMode}
                                theme={appStore.theme.value}
                                designSystem={appStore.designSystem.value}
                                translations={activeTranslations}
                                additionalErrors={jsonFormsPropsForRender.additionalErrors}
                                externalSchemas={currentExample.externalSchemas}
                                customStyle={webComponentThemeStyle}
                                onchange={onChange}
                                onvaliditychange={onValidityChange}
                                onhandleaction={onHandleAction}
                              />
                            {:else}
                              <div class="text-foreground" data-mode={formModeOverride}>
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
                            <Button
                              variant="outline"
                              size="icon"
                              onclick={() => editors.reload('data')}
                              title={translateDemo('editor.data.reload')}
                            >
                              <RotateCcwIcon class="size-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onclick={() => editors.apply('data')}
                              title={translateDemo('editor.data.apply')}
                            >
                              <SaveIcon class="size-4" />
                            </Button>
                          </div>
                        </div>
                        <div class="border-border bg-card mt-4 overflow-hidden rounded-lg border">
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
                      class="border-border bg-card text-card-foreground rounded-lg border p-6 shadow-sm"
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
                          readonly={jsonFormsPropsForRender.readonly}
                          validationMode={jsonFormsPropsForRender.validationMode}
                          locale={effectiveFormLocale}
                          mode={effectiveFormMode}
                          theme={appStore.theme.value}
                          designSystem={appStore.designSystem.value}
                          translations={activeTranslations}
                          additionalErrors={jsonFormsPropsForRender.additionalErrors}
                          externalSchemas={currentExample.externalSchemas}
                          customStyle={webComponentThemeStyle}
                          onchange={onChange}
                          onvaliditychange={onValidityChange}
                          onhandleaction={onHandleAction}
                        />
                      {:else if jsonFormsPropsForRender}
                        <div class="text-foreground" data-mode={formModeOverride}>
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
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={() => editors.reload('schema')}
                        title={translateDemo('editor.schema.reload')}
                      >
                        <RotateCcwIcon class="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={() => editors.apply('schema')}
                        title={translateDemo('editor.schema.apply')}
                      >
                        <SaveIcon class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div class="border-border bg-card overflow-hidden rounded-lg border">
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
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={() => editors.reload('uischema')}
                        title={translateDemo('editor.uiSchema.reload')}
                      >
                        <RotateCcwIcon class="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={() => editors.apply('uischema')}
                        title={translateDemo('editor.uiSchema.apply')}
                      >
                        <SaveIcon class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div class="border-border bg-card overflow-hidden rounded-lg border">
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
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={() => editors.reload('uischemas')}
                        title={translateDemo('editor.uiSchemas.reload')}
                      >
                        <RotateCcwIcon class="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={() => editors.apply('uischemas')}
                        title={translateDemo('editor.uiSchemas.apply')}
                      >
                        <SaveIcon class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div class="border-border bg-card overflow-hidden rounded-lg border">
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
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={() => editors.reload('i18n')}
                        title={translateDemo('editor.i18n.reload')}
                      >
                        <RotateCcwIcon class="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={() => editors.apply('i18n')}
                        title={translateDemo('editor.i18n.apply')}
                      >
                        <SaveIcon class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div class="border-border bg-card overflow-hidden rounded-lg border">
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

              <Tabs.Content value={tabValues.config} class="pt-5">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold">{translateDemo('editor.config.label')}</h2>
                    <div class="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={() => editors.reload('config')}
                        title={translateDemo('editor.config.reload')}
                      >
                        <RotateCcwIcon class="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={() => editors.apply('config')}
                        title={translateDemo('editor.config.apply')}
                      >
                        <SaveIcon class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div class="border-border bg-card overflow-hidden rounded-lg border">
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
                        <Button
                          variant="outline"
                          size="icon"
                          onclick={() => editors.reload('data')}
                          title={translateDemo('editor.data.reload')}
                        >
                          <RotateCcwIcon class="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onclick={() => editors.apply('data')}
                          title={translateDemo('editor.data.apply')}
                        >
                          <SaveIcon class="size-4" />
                        </Button>
                      </div>
                    </div>
                    <div class="border-border bg-card overflow-hidden rounded-lg border">
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
          </Tabs.Root>
        {/key}
      </section>
    {/if}
  </div>

  {#if toastVisible}
    <div class="pointer-events-none fixed top-4 right-4 z-50">
      <div
        class="border-border bg-popover text-popover-foreground rounded-md border px-4 py-3 text-sm shadow-lg"
      >
        {toastText}
      </div>
    </div>
  {/if}
{/if}
