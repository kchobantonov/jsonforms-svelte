<script lang="ts">
  import { page } from '$app/state';
  import JsonFormsWebComponentWrapper from '$lib/components/JsonFormsWebComponentWrapper.svelte';
  import MonacoEditor from '$lib/components/MonacoEditor.svelte';
  import { getWebComponentThemeStyle, useAppStore } from '$lib/store/index.svelte';
  import { type JsonFormsChangeEvent } from '@chobantonov/jsonforms-svelte';
  import {
    configureDataValidation,
    configureJsonSchemaValidation,
    configureUISchemaValidation,
    configureUISchemasValidation,
    createShadcnDemoExamples,
    createTranslator,
    getMonacoModelForUri,
    monaco,
    type DemoExample,
    type MonacoApi,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  import {
    createAjv,
    JsonForms,
    type ActionEvent,
    type JsonFormsProps,
  } from '@chobantonov/jsonforms-svelte-extended';
  import {
    Button,
    Pane,
    SplitPane,
    ValidationIcon,
    shadcnCells,
    shadcnRenderers,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { shadcnExtendedRenderers } from '@chobantonov/jsonforms-svelte-shadcn-extended';
  import type { StateProps } from '@jsonforms/examples';
  import { RotateCcwIcon, SaveIcon } from '@lucide/svelte';
  import { Tabs } from '@chobantonov/jsonforms-svelte-shadcn';
  import type { ErrorObject } from 'ajv';
  import cloneDeep from 'lodash/cloneDeep';
  import find from 'lodash/find';
  import { onDestroy, untrack } from 'svelte';

  const appStore = useAppStore();
  const examples = createShadcnDemoExamples(() => appStore.jsonforms.locale.value);
  const webComponentThemeStyle = $derived(getWebComponentThemeStyle());

  const currentExample = $derived.by(
    () => examples.find((example) => example.name === page.params.name) as DemoExample | undefined,
  );

  const initialState = (example: DemoExample): JsonFormsProps => ({
    ajv: createAjv(example.i18n),
    schema: example.schema,
    uischema: example.uischema,
    data: example.data,
    config: example.config,
    uischemas: example.uischemas,
    i18n: example.i18n,
    renderers: [...shadcnRenderers, ...shadcnExtendedRenderers],
    cells: shadcnCells,
    readonly: appStore.jsonforms.readonly.value,
    validationMode: appStore.jsonforms.validationMode,
  });

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

  const isObjectRecord = (value: unknown): value is JsonObject =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

  const parseJsonObject = (modelValue: string, label: string): JsonObject | undefined => {
    if (modelValue === '') {
      return undefined;
    }

    const parsed = JSON.parse(modelValue);

    if (!isObjectRecord(parsed)) {
      throw new Error(`${label} must be a JSON object.`);
    }

    return parsed;
  };

  const parseJsonArray = <TypeEl,>(modelValue: string, label: string): TypeEl[] | undefined => {
    if (modelValue === '') {
      return undefined;
    }

    const parsed = JSON.parse(modelValue);

    if (!Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON array.`);
    }

    return parsed as TypeEl[];
  };

  const getTranslations = (i18n: JsonFormsProps['i18n'] | undefined): JsonObject | undefined =>
    (i18n as (DemoExample['i18n'] & { translations?: JsonObject }) | undefined)?.translations;

  const buildDemoI18n = (translations: JsonObject | undefined): DemoExample['i18n'] | undefined => {
    if (!translations) {
      return undefined;
    }

    const locale = appStore.jsonforms.locale.value;

    return {
      locale,
      translate: createTranslator(locale, translations),
      translations,
    };
  };

  let jsonFormsProps = $state<JsonFormsProps | undefined>(undefined);
  let errors = $state<ErrorObject[]>([]);
  let schemaModel = $state<monaco.editor.ITextModel | null>(null);
  let uischemaModel = $state<monaco.editor.ITextModel | null>(null);
  let uischemasModel = $state<monaco.editor.ITextModel | null>(null);
  let i18nModel = $state<monaco.editor.ITextModel | null>(null);
  let configModel = $state<monaco.editor.ITextModel | null>(null);
  let dataModel = $state<monaco.editor.ITextModel | null>(null);
  let toastVisible = $state(false);
  let toastText = $state('');
  let activeTab = $state<string>(tabValues.demo);
  let loadedExampleName = $state<string | undefined>(undefined);
  let previousExampleName = $state<string | undefined>(undefined);
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;
  let formModeOverride = $state<'light' | 'dark' | undefined>(undefined);

  const demoTabLabel = $derived(
    appStore.layout.value === 'demo-and-data' ? 'Demo and Data' : 'Demo',
  );
  const activeTranslations = $derived(getTranslations(jsonFormsProps?.i18n));
  const jsonFormsPropsForRender = $derived.by<JsonFormsProps | undefined>(() => {
    if (!jsonFormsProps) {
      return undefined;
    }

    return {
      ...jsonFormsProps,
      config: {
        ...(jsonFormsProps.config ?? {}),
        ...(appStore.jsonforms.config ?? {}),
      },
    };
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
      updateMonacoModels(example);
      errors = [];
      toastVisible = false;
      toastText = '';
      formModeOverride = undefined;
      loadedExampleName = exampleName;

      const storedActiveTab = untrack(() => String(appStore.activeTab.value ?? tabValues.demo));
      activeTab = visibleTabs.includes(storedActiveTab) ? storedActiveTab : tabValues.demo;
      appStore.activeTab.value = activeTab;
    } else {
      jsonFormsProps = undefined;
      schemaModel = null;
      uischemaModel = null;
      uischemasModel = null;
      i18nModel = null;
      configModel = null;
      dataModel = null;
      errors = [];
      toastVisible = false;
      toastText = '';
      formModeOverride = undefined;
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
    const locale = appStore.jsonforms.locale.value;
    const translations = activeTranslations;

    if (jsonFormsProps && translations && jsonFormsProps.i18n?.locale !== locale) {
      const nextI18n = buildDemoI18n(translations);
      jsonFormsProps.i18n = nextI18n;
      jsonFormsProps.ajv = createAjv(nextI18n);
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
    if (currentExample) {
      dataModel = getMonacoModelForUri(
        monaco.Uri.parse(toDataUri(currentExample.name)),
        event.data !== undefined ? JSON.stringify(event.data, null, 2) : '',
      );
    }
    errors = event.errors ?? [];
  }

  async function onHandleAction(event: ActionEvent) {
    await currentExample?.onHandleAction?.(event);
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

  function saveMonacoModel(
    model: monaco.editor.ITextModel | null,
    apply: (value: string) => void,
    successMessage: string,
  ) {
    if (!model) return;

    try {
      apply(model.getValue());
      notify(successMessage);
    } catch (error) {
      notify(`Error: ${error}`);
    }
  }

  function reloadMonacoData() {
    const example = untrack(() => find(examples, (item) => item.name === page.params.name));
    if (!example) return;

    dataModel = getMonacoModelForUri(
      monaco.Uri.parse(toDataUri(example.name)),
      example.data !== undefined ? JSON.stringify(example.data, null, 2) : '',
    );
    notify('Original example data loaded. Apply it to take effect.');
  }

  function saveMonacoData() {
    saveMonacoModel(
      dataModel,
      (modelValue) => {
        if (jsonFormsProps) {
          jsonFormsProps.data = modelValue === '' ? undefined : JSON.parse(modelValue);
        }
      },
      'New data applied.',
    );
  }

  function reloadMonacoSchema() {
    const example = untrack(() => find(examples, (item) => item.name === page.params.name));
    if (!example) return;

    schemaModel = getMonacoModelForUri(
      monaco.Uri.parse(toSchemaUri(example.name)),
      example.schema ? JSON.stringify(example.schema, null, 2) : '',
    );
    notify('Original example schema loaded. Apply it to take effect.');
  }

  function saveMonacoSchema() {
    saveMonacoModel(
      schemaModel,
      (modelValue) => {
        if (jsonFormsProps) {
          jsonFormsProps.schema = modelValue ? JSON.parse(modelValue) : undefined;
        }
      },
      'New schema applied.',
    );

    if (currentExample && jsonFormsProps?.schema) {
      configureDataValidation(
        monaco,
        `inmemory://${toSchemaUri(currentExample.name)}`,
        toDataUri(currentExample.name),
        cloneDeep(jsonFormsProps.schema),
      );
    }
  }

  function reloadMonacoUiSchema() {
    const example = untrack(() => find(examples, (item) => item.name === page.params.name));
    if (!example) return;

    uischemaModel = getMonacoModelForUri(
      monaco.Uri.parse(toUiSchemaUri(example.name)),
      example.uischema ? JSON.stringify(example.uischema, null, 2) : '',
    );
    notify('Original example UI schema loaded. Apply it to take effect.');
  }

  function saveMonacoUiSchema() {
    saveMonacoModel(
      uischemaModel,
      (modelValue) => {
        if (jsonFormsProps) {
          jsonFormsProps.uischema = modelValue ? JSON.parse(modelValue) : undefined;
        }
      },
      'New UI schema applied.',
    );
  }

  function reloadMonacoUiSchemas() {
    const example = untrack(() => find(examples, (item) => item.name === page.params.name));
    if (!example) return;

    uischemasModel = getMonacoModelForUri(
      monaco.Uri.parse(toUiSchemasUri(example.name)),
      example.uischemas !== undefined ? JSON.stringify(example.uischemas, null, 2) : '',
    );
    notify('Original example UI schemas loaded. Apply them to take effect.');
  }

  function saveMonacoUiSchemas() {
    saveMonacoModel(
      uischemasModel,
      (modelValue) => {
        if (jsonFormsProps) {
          jsonFormsProps.uischemas = parseJsonArray(
            modelValue,
            'UI Schemas',
          ) as JsonFormsProps['uischemas'];
        }
      },
      'New UI schemas applied.',
    );
  }

  function reloadMonacoI18n() {
    const example = untrack(() => find(examples, (item) => item.name === page.params.name));
    if (!example) return;

    i18nModel = getMonacoModelForUri(
      monaco.Uri.parse(toI18nUri(example.name)),
      getTranslations(example.i18n) !== undefined
        ? JSON.stringify(getTranslations(example.i18n), null, 2)
        : '',
    );
    notify('Original example translations loaded. Apply them to take effect.');
  }

  function saveMonacoI18n() {
    saveMonacoModel(
      i18nModel,
      (modelValue) => {
        const nextI18n = buildDemoI18n(parseJsonObject(modelValue, 'Internationalization'));

        if (jsonFormsProps) {
          jsonFormsProps.i18n = nextI18n;
          jsonFormsProps.ajv = createAjv(nextI18n);
        }
      },
      'New internationalization data applied.',
    );
  }

  function reloadMonacoConfig() {
    const example = untrack(() => find(examples, (item) => item.name === page.params.name));
    if (!example) return;

    configModel = getMonacoModelForUri(
      monaco.Uri.parse(toConfigUri(example.name)),
      example.config !== undefined ? JSON.stringify(example.config, null, 2) : '',
    );
    notify('Original example config loaded. Apply it to take effect.');
  }

  function saveMonacoConfig() {
    saveMonacoModel(
      configModel,
      (modelValue) => {
        if (jsonFormsProps) {
          jsonFormsProps.config = parseJsonObject(modelValue, 'Config');
        }
      },
      'New config applied.',
    );
  }

  function updateMonacoModels(example: DemoExample) {
    schemaModel = getMonacoModelForUri(
      monaco.Uri.parse(toSchemaUri(example.name)),
      example.schema ? JSON.stringify(example.schema, null, 2) : '',
    );

    uischemaModel = getMonacoModelForUri(
      monaco.Uri.parse(toUiSchemaUri(example.name)),
      example.uischema ? JSON.stringify(example.uischema, null, 2) : '',
    );

    uischemasModel = getMonacoModelForUri(
      monaco.Uri.parse(toUiSchemasUri(example.name)),
      example.uischemas !== undefined ? JSON.stringify(example.uischemas, null, 2) : '',
    );

    i18nModel = getMonacoModelForUri(
      monaco.Uri.parse(toI18nUri(example.name)),
      getTranslations(example.i18n) !== undefined
        ? JSON.stringify(getTranslations(example.i18n), null, 2)
        : '',
    );

    configModel = getMonacoModelForUri(
      monaco.Uri.parse(toConfigUri(example.name)),
      example.config !== undefined ? JSON.stringify(example.config, null, 2) : '',
    );

    dataModel = getMonacoModelForUri(
      monaco.Uri.parse(toDataUri(example.name)),
      example.data !== undefined ? JSON.stringify(example.data, null, 2) : '',
    );
  }

  function disposeMonacoModelsForExample(name: string | undefined) {
    if (!name) return;
    monaco.editor.getModel(monaco.Uri.parse(toSchemaUri(name)))?.dispose();
    monaco.editor.getModel(monaco.Uri.parse(toUiSchemaUri(name)))?.dispose();
    monaco.editor.getModel(monaco.Uri.parse(toUiSchemasUri(name)))?.dispose();
    monaco.editor.getModel(monaco.Uri.parse(toI18nUri(name)))?.dispose();
    monaco.editor.getModel(monaco.Uri.parse(toConfigUri(name)))?.dispose();
    monaco.editor.getModel(monaco.Uri.parse(toDataUri(name)))?.dispose();
  }

  const toSchemaUri = (id: string) => `${id}.schema.json`;
  const toUiSchemaUri = (id: string) => `${id}.uischema.json`;
  const toUiSchemasUri = (id: string) => `${id}.uischemas.json`;
  const toI18nUri = (id: string) => `${id}.i18n.json`;
  const toConfigUri = (id: string) => `${id}.config.json`;
  const toDataUri = (id: string) => `${id}.data.json`;
  let validationsRegistered = false;

  function registerValidations(editor: MonacoApi) {
    if (validationsRegistered) {
      return;
    }

    configureJsonSchemaValidation(editor, ['*.schema.json']);
    configureUISchemaValidation(editor, ['*.uischema.json']);
    configureUISchemasValidation(editor, ['*.uischemas.json']);

    for (const example of examples) {
      if (example.schema) {
        configureDataValidation(
          editor,
          `inmemory://${toSchemaUri(example.name)}`,
          toDataUri(example.name),
          { ...example.schema, title: example.label },
        );
      }
    }

    validationsRegistered = true;
  }

  function setActiveTab(value: string) {
    activeTab = value;
    appStore.activeTab.value = value;
  }

  $effect(() => {
    const currentExampleName = currentExample?.name;

    if (previousExampleName && previousExampleName !== currentExampleName) {
      disposeMonacoModelsForExample(previousExampleName);
    }

    previousExampleName = currentExampleName;
  });

  onDestroy(() => {
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    disposeMonacoModelsForExample(previousExampleName);
  });
</script>

<svelte:head>
  <title>JSON Forms Svelte Shadcn Example</title>
  <meta name="description" content="JSON Forms Svelte Shadcn Example" />
</svelte:head>

{#if currentExample === undefined}
  <div class="rounded-lg border border-destructive/30 bg-destructive/10 p-6 text-destructive">
    <p class="text-base font-medium">Example not found: {page.params.name}</p>
  </div>
{:else if !isCurrentExampleLoaded}
  <div class="min-h-[12rem]"></div>
{:else}
  <div class="space-y-6 py-4">
    {#if !appStore.formOnly.value}
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-3xl font-semibold text-foreground">{currentExample.label}</h1>
        </div>
      </div>
    {/if}

    {#if appStore.formOnly.value}
      <section
        class="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm"
        class:overflow-visible={shouldUseWebComponentView}
        data-mode={formModeOverride}
      >
        {#if shouldUseWebComponentView && jsonFormsPropsForRender}
          <JsonFormsWebComponentWrapper
            data={jsonFormsPropsForRender.data}
            schema={jsonFormsPropsForRender.schema}
            uischema={jsonFormsPropsForRender.uischema}
            uischemas={jsonFormsPropsForRender.uischemas}
            config={jsonFormsPropsForRender.config}
            readonly={jsonFormsPropsForRender.readonly}
            validationMode={jsonFormsPropsForRender.validationMode}
            locale={appStore.jsonforms.locale.value}
            mode={effectiveFormMode}
            theme={appStore.theme.value}
            designSystem={appStore.designSystem.value}
            translations={activeTranslations}
            additionalErrors={jsonFormsPropsForRender.additionalErrors}
            customStyle={webComponentThemeStyle}
            onchange={onChange}
            onhandleaction={onHandleAction}
          />
        {:else if jsonFormsPropsForRender}
          <div class="text-foreground" data-mode={formModeOverride}>
            <JsonForms
              {...jsonFormsPropsForRender}
              onchange={onChange}
              context={formContext}
              onhandleaction={onHandleAction}
            />
          </div>
        {/if}
      </section>
    {:else}
      <section
        class="rounded-lg border border-border bg-card text-card-foreground shadow-sm"
        class:overflow-hidden={!appStore.useWebComponentView.value}
        class:overflow-visible={appStore.useWebComponentView.value}
      >
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <div class="border-b border-border px-5 py-5">
            <Tabs.List>
              <Tabs.Trigger value={tabValues.demo}>
                <span class="flex items-center gap-2">
                  <span>{demoTabLabel}</span>
                  <ValidationIcon {errors} />
                </span>
              </Tabs.Trigger>
              <div class="flex-1"></div>
              <Tabs.Trigger value={tabValues.schema}>Schema</Tabs.Trigger>
              <Tabs.Trigger value={tabValues.uiSchema}>UI Schema</Tabs.Trigger>
              <Tabs.Trigger value={tabValues.uiSchemas}>UI Schemas</Tabs.Trigger>
              <Tabs.Trigger value={tabValues.internationalization}>
                Internationalization
              </Tabs.Trigger>
              <Tabs.Trigger value={tabValues.config}>Config</Tabs.Trigger>
              {#if appStore.layout.value !== 'demo-and-data'}
                <Tabs.Trigger value={tabValues.data}>Data</Tabs.Trigger>
              {/if}
            </Tabs.List>

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
                  class={`mt-5 ${appStore.useWebComponentView.value ? 'overflow-visible' : ''}`}
                >
                  <Pane
                    class={`pe-4 ${appStore.useWebComponentView.value ? 'overflow-visible' : ''}`}
                  >
                    <div class="pointer-events-auto select-text">
                      <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold">Demo</h3>
                      </div>
                      <div
                        class="mt-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm"
                        class:overflow-visible={shouldUseWebComponentView}
                        data-mode={formModeOverride}
                      >
                        {#if jsonFormsPropsForRender}
                          {#if shouldUseWebComponentView}
                            <JsonFormsWebComponentWrapper
                              data={jsonFormsPropsForRender.data}
                              schema={jsonFormsPropsForRender.schema}
                              uischema={jsonFormsPropsForRender.uischema}
                              uischemas={jsonFormsPropsForRender.uischemas}
                              config={jsonFormsPropsForRender.config}
                              readonly={jsonFormsPropsForRender.readonly}
                              validationMode={jsonFormsPropsForRender.validationMode}
                              locale={appStore.jsonforms.locale.value}
                              mode={effectiveFormMode}
                              theme={appStore.theme.value}
                              designSystem={appStore.designSystem.value}
                              translations={activeTranslations}
                              additionalErrors={jsonFormsPropsForRender.additionalErrors}
                              customStyle={webComponentThemeStyle}
                              onchange={onChange}
                              onhandleaction={onHandleAction}
                            />
                          {:else}
                            <div class="text-foreground" data-mode={formModeOverride}>
                              <JsonForms
                                {...jsonFormsPropsForRender}
                                onchange={onChange}
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
                        <h3 class="text-lg font-semibold">Data</h3>
                        <div class="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onclick={reloadMonacoData}
                            title="Reload example data"
                          >
                            <RotateCcwIcon class="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onclick={saveMonacoData}
                            title="Apply data changes"
                          >
                            <SaveIcon class="size-4" />
                          </Button>
                        </div>
                      </div>
                      <div class="mt-4 overflow-hidden rounded-lg border border-border bg-card">
                        {#if activeTab === tabValues.demo}
                          <MonacoEditor
                            language="json"
                            bind:value={dataModel}
                            style="height: calc(100vh - 200px)"
                            editorBeforeMount={registerValidations}
                          />
                        {/if}
                      </div>
                    </div>
                  </Pane>
                </SplitPane>
              {:else}
                <div class="mt-5 space-y-5">
                  <section
                    class="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm"
                    class:overflow-visible={shouldUseWebComponentView}
                    data-mode={formModeOverride}
                  >
                    {#if shouldUseWebComponentView && jsonFormsPropsForRender}
                      <JsonFormsWebComponentWrapper
                        data={jsonFormsPropsForRender.data}
                        schema={jsonFormsPropsForRender.schema}
                        uischema={jsonFormsPropsForRender.uischema}
                        uischemas={jsonFormsPropsForRender.uischemas}
                        config={jsonFormsPropsForRender.config}
                        readonly={jsonFormsPropsForRender.readonly}
                        validationMode={jsonFormsPropsForRender.validationMode}
                        locale={appStore.jsonforms.locale.value}
                        mode={effectiveFormMode}
                        theme={appStore.theme.value}
                        designSystem={appStore.designSystem.value}
                        translations={activeTranslations}
                        additionalErrors={jsonFormsPropsForRender.additionalErrors}
                        customStyle={webComponentThemeStyle}
                        onchange={onChange}
                        onhandleaction={onHandleAction}
                      />
                    {:else if jsonFormsPropsForRender}
                      <div class="text-foreground" data-mode={formModeOverride}>
                        <JsonForms
                          {...jsonFormsPropsForRender}
                          onchange={onChange}
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
                  <h2 class="text-xl font-bold">Schema</h2>
                  <div class="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onclick={reloadMonacoSchema}
                      title="Reload example schema"
                    >
                      <RotateCcwIcon class="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onclick={saveMonacoSchema}
                      title="Apply schema changes"
                    >
                      <SaveIcon class="size-4" />
                    </Button>
                  </div>
                </div>
                <div class="overflow-hidden rounded-lg border border-border bg-card">
                  {#if activeTab === tabValues.schema}
                    <MonacoEditor
                      language="json"
                      bind:value={schemaModel}
                      class="h-[calc(100vh-16rem)] min-h-[480px]"
                      editorBeforeMount={registerValidations}
                    />
                  {/if}
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value={tabValues.uiSchema} class="pt-5">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h2 class="text-xl font-bold">UI Schema</h2>
                  <div class="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onclick={reloadMonacoUiSchema}
                      title="Reload example UI schema"
                    >
                      <RotateCcwIcon class="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onclick={saveMonacoUiSchema}
                      title="Apply UI schema changes"
                    >
                      <SaveIcon class="size-4" />
                    </Button>
                  </div>
                </div>
                <div class="overflow-hidden rounded-lg border border-border bg-card">
                  {#if activeTab === tabValues.uiSchema}
                    <MonacoEditor
                      language="json"
                      bind:value={uischemaModel}
                      class="h-[calc(100vh-16rem)] min-h-[480px]"
                      editorBeforeMount={registerValidations}
                    />
                  {/if}
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value={tabValues.uiSchemas} class="pt-5">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h2 class="text-xl font-bold">UI Schemas</h2>
                  <div class="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onclick={reloadMonacoUiSchemas}
                      title="Reload example UI schemas"
                    >
                      <RotateCcwIcon class="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onclick={saveMonacoUiSchemas}
                      title="Apply UI schemas changes"
                    >
                      <SaveIcon class="size-4" />
                    </Button>
                  </div>
                </div>
                <div class="overflow-hidden rounded-lg border border-border bg-card">
                  {#if activeTab === tabValues.uiSchemas}
                    <MonacoEditor
                      language="json"
                      bind:value={uischemasModel}
                      class="h-[calc(100vh-16rem)] min-h-[480px]"
                      editorBeforeMount={registerValidations}
                    />
                  {/if}
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value={tabValues.internationalization} class="pt-5">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h2 class="text-xl font-bold">Internationalization</h2>
                  <div class="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onclick={reloadMonacoI18n}
                      title="Reload example internationalization"
                    >
                      <RotateCcwIcon class="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onclick={saveMonacoI18n}
                      title="Apply internationalization changes"
                    >
                      <SaveIcon class="size-4" />
                    </Button>
                  </div>
                </div>
                <div class="overflow-hidden rounded-lg border border-border bg-card">
                  {#if activeTab === tabValues.internationalization}
                    <MonacoEditor
                      language="json"
                      bind:value={i18nModel}
                      class="h-[calc(100vh-16rem)] min-h-[480px]"
                      editorBeforeMount={registerValidations}
                    />
                  {/if}
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value={tabValues.config} class="pt-5">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h2 class="text-xl font-bold">Config</h2>
                  <div class="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onclick={reloadMonacoConfig}
                      title="Reload example config"
                    >
                      <RotateCcwIcon class="size-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onclick={saveMonacoConfig}
                      title="Apply config changes"
                    >
                      <SaveIcon class="size-4" />
                    </Button>
                  </div>
                </div>
                <div class="overflow-hidden rounded-lg border border-border bg-card">
                  {#if activeTab === tabValues.config}
                    <MonacoEditor
                      language="json"
                      bind:value={configModel}
                      class="h-[calc(100vh-16rem)] min-h-[480px]"
                      editorBeforeMount={registerValidations}
                    />
                  {/if}
                </div>
              </div>
            </Tabs.Content>

            {#if appStore.layout.value !== 'demo-and-data'}
              <Tabs.Content value={tabValues.data} class="pt-5">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold">Data</h2>
                    <div class="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={reloadMonacoData}
                        title="Reload example data"
                      >
                        <RotateCcwIcon class="size-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onclick={saveMonacoData}
                        title="Apply data changes"
                      >
                        <SaveIcon class="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div class="overflow-hidden rounded-lg border border-border bg-card">
                    {#if activeTab === tabValues.data}
                      <MonacoEditor
                        language="json"
                        bind:value={dataModel}
                        class="h-[calc(100vh-16rem)] min-h-[480px]"
                        editorBeforeMount={registerValidations}
                      />
                    {/if}
                  </div>
                </div>
              </Tabs.Content>
            {/if}
          </div>
        </Tabs.Root>
      </section>
    {/if}
  </div>

  {#if toastVisible}
    <div class="pointer-events-none fixed top-4 right-4 z-50">
      <div
        class="rounded-md border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg"
      >
        {toastText}
      </div>
    </div>
  {/if}
{/if}
