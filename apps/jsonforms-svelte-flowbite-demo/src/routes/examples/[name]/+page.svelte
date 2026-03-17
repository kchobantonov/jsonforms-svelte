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
    createFlowbiteDemoExamples,
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
    defaultStyles,
    flowbiteRenderers,
    mergeStyles,
    StylesContextSymbol,
    ValidationIcon,
  } from '@chobantonov/jsonforms-svelte-flowbite';
  import { flowbiteExtendedRenderers } from '@chobantonov/jsonforms-svelte-flowbite-extended';
  import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
  import type { StateProps } from '@jsonforms/examples';
  import type { ErrorObject } from 'ajv';
  import {
    Button,
    Card,
    Heading,
    Hr,
    Pane,
    SplitPane,
    TabItem,
    Tabs,
    Toast,
    ToolbarButton,
    Tooltip,
  } from 'flowbite-svelte';
  import { FloppyDiskOutline, InfoCircleOutline, UndoOutline } from 'flowbite-svelte-icons';
  import cloneDeep from 'lodash/cloneDeep';
  import find from 'lodash/find';
  import { onDestroy, setContext, untrack } from 'svelte';

  const appStore = useAppStore();
  const examples = createFlowbiteDemoExamples(() => appStore.jsonforms.locale.value);
  const currentExample = $derived.by(
    () => examples.find((example) => example.name === page.params.name) as DemoExample | undefined,
  );

  const renderers: JsonFormsRendererRegistryEntry[] = [
    ...flowbiteRenderers,
    ...flowbiteExtendedRenderers,
  ];

  const initialState = (
    example: DemoExample,
    cells?: any,
    nextRenderers?: any,
  ): JsonFormsProps => ({
    ajv: createAjv(example.i18n),
    schema: example.schema,
    uischema: example.uischema,
    data: example.data,
    config: example.config,
    uischemas: example.uischemas,
    cells,
    renderers: nextRenderers,
    i18n: example.i18n,
    additionalErrors: undefined,
    middleware: undefined,
  });

  type JsonObject = Record<string, unknown>;
  type Action = NonNullable<DemoExample['actions']>[number];

  const tabKeys = {
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
  let errors = $state<ErrorObject<string, Record<string, any>, unknown>[]>([]);

  let schemaModel = $state<monaco.editor.ITextModel | null>(null);
  let uischemaModel = $state<monaco.editor.ITextModel | null>(null);
  let uischemasModel = $state<monaco.editor.ITextModel | null>(null);
  let i18nModel = $state<monaco.editor.ITextModel | null>(null);
  let configModel = $state<monaco.editor.ITextModel | null>(null);
  let dataModel = $state<monaco.editor.ITextModel | null>(null);
  let loadedExampleName = $state<string | undefined>(undefined);
  let previousExampleName = $state<string | undefined>(undefined);
  let formModeOverride = $state<'light' | 'dark' | undefined>(undefined);

  let snackbar = $state(false);
  let snackbarText = $state('');
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  const webComponentThemeStyle = $derived(getWebComponentThemeStyle(appStore.themeColor.value));
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
      tabKeys.demo,
      tabKeys.schema,
      tabKeys.uiSchema,
      tabKeys.uiSchemas,
      tabKeys.internationalization,
      tabKeys.config,
    ];

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
      jsonFormsProps = initialState(example, undefined, renderers);
      updateMonacoModels(example);
      errors = [];
      formModeOverride = undefined;
      loadedExampleName = exampleName;
    } else {
      jsonFormsProps = undefined;
      errors = [];
      formModeOverride = undefined;
      loadedExampleName = undefined;
    }
  });

  $effect(() => {
    appStore.jsonforms.readonly.value;

    if (jsonFormsProps) {
      jsonFormsProps.readonly = appStore.jsonforms.readonly.value;
    }
  });

  $effect(() => {
    appStore.jsonforms.validationMode;

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
    if (!visibleTabs.includes(String(appStore.activeTab.value))) {
      appStore.activeTab.value = tabKeys.demo as any;
    }
  });

  const onChange = (event: JsonFormsChangeEvent) => {
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
  };

  const onHandleAction = async (event: ActionEvent) => {
    await currentExample?.onHandleAction?.(event);
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

  const saveMonacoModel = (
    model: monaco.editor.ITextModel | null,
    apply: (value: string) => void,
    successToast: string,
  ) => {
    if (!model) {
      return;
    }

    const modelValue = model.getValue();

    try {
      apply(modelValue);
      toast(successToast);
    } catch (error) {
      toast(`Error: ${error}`);
    }
  };

  function reloadMonacoData() {
    const example = untrack(() => find(examples, (example) => example.name === page.params.name));

    if (example) {
      dataModel = getMonacoModelForUri(
        monaco.Uri.parse(toDataUri(example.name)),
        example.data !== undefined ? JSON.stringify(example.data, null, 2) : '',
      );
      toast('Original example data loaded. Apply it to take effect.');
    }
  }

  function saveMonacoData() {
    saveMonacoModel(
      dataModel,
      (modelValue) => {
        if (jsonFormsProps) {
          jsonFormsProps.data = modelValue === '' ? undefined : JSON.parse(modelValue);
        }
      },
      'New data applied',
    );
  }

  function reloadMonacoSchema() {
    const example = untrack(() => find(examples, (example) => example.name === page.params.name));

    if (example) {
      schemaModel = getMonacoModelForUri(
        monaco.Uri.parse(toSchemaUri(example.name)),
        example.schema ? JSON.stringify(example.schema, null, 2) : '',
      );
      toast('Original example schema loaded. Apply it to take effect.');
    }
  }

  function saveMonacoSchema() {
    saveMonacoModel(
      schemaModel,
      (modelValue) => {
        if (jsonFormsProps) {
          jsonFormsProps.schema = modelValue ? JSON.parse(modelValue) : undefined;
        }
      },
      'New schema applied',
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
    const example = untrack(() => find(examples, (example) => example.name === page.params.name));

    if (example) {
      uischemaModel = getMonacoModelForUri(
        monaco.Uri.parse(toUiSchemaUri(example.name)),
        example.uischema ? JSON.stringify(example.uischema, null, 2) : '',
      );
      toast('Original example UI schema loaded. Apply it to take effect.');
    }
  }

  function saveMonacoUiSchema() {
    saveMonacoModel(
      uischemaModel,
      (modelValue) => {
        if (jsonFormsProps) {
          jsonFormsProps.uischema = modelValue ? JSON.parse(modelValue) : undefined;
        }
      },
      'New UI schema applied',
    );
  }

  function reloadMonacoUiSchemas() {
    const example = untrack(() => find(examples, (example) => example.name === page.params.name));

    if (example) {
      uischemasModel = getMonacoModelForUri(
        monaco.Uri.parse(toUiSchemasUri(example.name)),
        example.uischemas !== undefined ? JSON.stringify(example.uischemas, null, 2) : '',
      );
      toast('Original example UI schemas loaded. Apply them to take effect.');
    }
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
      'New UI schemas applied',
    );
  }

  function reloadMonacoI18n() {
    const example = untrack(() => find(examples, (example) => example.name === page.params.name));

    if (example) {
      i18nModel = getMonacoModelForUri(
        monaco.Uri.parse(toI18nUri(example.name)),
        getTranslations(example.i18n) !== undefined
          ? JSON.stringify(getTranslations(example.i18n), null, 2)
          : '',
      );
      toast('Original example translations loaded. Apply them to take effect.');
    }
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
      'New internationalization data applied',
    );
  }

  function reloadMonacoConfig() {
    const example = untrack(() => find(examples, (example) => example.name === page.params.name));

    if (example) {
      configModel = getMonacoModelForUri(
        monaco.Uri.parse(toConfigUri(example.name)),
        example.config !== undefined ? JSON.stringify(example.config, null, 2) : '',
      );
      toast('Original example config loaded. Apply it to take effect.');
    }
  }

  function saveMonacoConfig() {
    saveMonacoModel(
      configModel,
      (modelValue) => {
        if (jsonFormsProps) {
          jsonFormsProps.config = parseJsonObject(modelValue, 'Config');
        }
      },
      'New config applied',
    );
  }

  const updateMonacoModels = (example: DemoExample) => {
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
  };

  const disposeMonacoModelsForExample = (name: string | undefined) => {
    if (!name) return;
    monaco.editor.getModel(monaco.Uri.parse(toSchemaUri(name)))?.dispose();
    monaco.editor.getModel(monaco.Uri.parse(toUiSchemaUri(name)))?.dispose();
    monaco.editor.getModel(monaco.Uri.parse(toUiSchemasUri(name)))?.dispose();
    monaco.editor.getModel(monaco.Uri.parse(toI18nUri(name)))?.dispose();
    monaco.editor.getModel(monaco.Uri.parse(toConfigUri(name)))?.dispose();
    monaco.editor.getModel(monaco.Uri.parse(toDataUri(name)))?.dispose();
  };

  const toSchemaUri = (id: string): string => `${id}.schema.json`;
  const toUiSchemaUri = (id: string): string => `${id}.uischema.json`;
  const toUiSchemasUri = (id: string): string => `${id}.uischemas.json`;
  const toI18nUri = (id: string): string => `${id}.i18n.json`;
  const toConfigUri = (id: string): string => `${id}.config.json`;
  const toDataUri = (id: string): string => `${id}.data.json`;
  let validationsRegistered = false;

  const registerValidations = (editor: MonacoApi) => {
    if (validationsRegistered) {
      return;
    }

    configureJsonSchemaValidation(editor, ['*.schema.json']);
    configureUISchemaValidation(editor, ['*.uischema.json']);
    configureUISchemasValidation(editor, ['*.uischemas.json']);

    for (const example of examples) {
      const schema = {
        ...example.schema,
        title: example.label,
      };

      if (example.schema) {
        configureDataValidation(
          editor,
          `inmemory://${toSchemaUri(example.name)}`,
          toDataUri(example.name),
          schema,
        );
      }
    }

    validationsRegistered = true;
  };

  $effect(() => {
    const currentExampleName = currentExample?.name;

    if (previousExampleName && previousExampleName !== currentExampleName) {
      disposeMonacoModelsForExample(previousExampleName);
    }

    previousExampleName = currentExampleName;
  });

  onDestroy(() => {
    disposeMonacoModelsForExample(previousExampleName);
  });
</script>

<svelte:head>
  <title>JSON Forms Svelte Flowbite Example</title>
  <meta name="description" content="JSON Forms Svelte Flowbite Example" />
</svelte:head>

{#if currentExample === undefined}
  <div class="p-4 text-center">
    <Heading tag="h1" class="text-2xl font-bold text-red-600 dark:text-red-400">
      Example not found: {page.params.name}
    </Heading>
  </div>
{:else if !isCurrentExampleLoaded}
  <div class="p-4"></div>
{:else}
  <div>
    {#if !appStore.formOnly.value}
      <Card class="min-w-full p-4 sm:p-6 md:p-8">
        <Heading tag="h5" class="mb-4 text-2xl font-bold tracking-tight ">
          {currentExample.label}
        </Heading>

        <Tabs tabStyle="underline" bind:selected={appStore.activeTab.value}>
          <TabItem key={tabKeys.demo}>
            {#snippet titleSlot()}
              <div class="flex items-center gap-2">
                {appStore.layout.value === 'demo-and-data' ? 'Demo and Data' : 'Demo'}
                {#if errors}
                  <ValidationIcon {errors} />
                {/if}
              </div>
            {/snippet}

            <div class="flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold">JSONForm</Heading>
              {#if currentExample.actions}
                <div class="flex gap-2">
                  {#each currentExample.actions as action, index}
                    <Button onclick={() => handleAction(action)}>
                      {action.label}
                    </Button>
                  {/each}
                </div>
              {/if}
            </div>

            <Hr class="my-4" />

            {#if appStore.layout.value === 'demo-and-data'}
              <SplitPane initialSizes={[75, 25]}>
                <Pane class="pr-4">
                  <div class="pointer-events-auto select-text">
                    <div class="mb-4 flex items-center justify-between">
                      <Heading tag="h6" class="text-lg font-semibold">Demo</Heading>
                    </div>
                    <Hr class="my-4" />
                    <div class="json-forms">
                      {#if jsonFormsPropsForRender}
                        {#if shouldUseWebComponentView}
                          <JsonFormsWebComponentWrapper
                            {...jsonFormsPropsForRender}
                            locale={appStore.jsonforms.locale.value}
                            mode={effectiveFormMode}
                            translations={activeTranslations}
                            customStyle={webComponentThemeStyle}
                            onchange={onChange}
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
                              context={formContext}
                              onhandleaction={onHandleAction}
                            />
                          </div>
                        {/if}
                      {/if}
                    </div>
                  </div>
                </Pane>
                <Pane class="pl-4">
                  <div class="pointer-events-auto select-text">
                    <div class="mb-4 flex items-center justify-between">
                      <Heading class="text-lg font-semibold">Data</Heading>
                      <div class="flex gap-2">
                        <ToolbarButton size="sm" onclick={reloadMonacoData}
                          ><UndoOutline class="h-5 w-5" /></ToolbarButton
                        >
                        <Tooltip>Reload Example Data</Tooltip>
                        <ToolbarButton size="sm" onclick={saveMonacoData}
                          ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                        >
                        <Tooltip>Apply Change To Example Data</Tooltip>
                      </div>
                    </div>
                    <Hr class="my-4" />
                    <MonacoEditor
                      language="json"
                      bind:value={dataModel}
                      style="height: calc(100vh - 200px)"
                      editorBeforeMount={registerValidations}
                    ></MonacoEditor>
                  </div>
                </Pane>
              </SplitPane>
            {:else}
              <div class="json-forms">
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
                      translations={activeTranslations}
                      additionalErrors={jsonFormsPropsForRender.additionalErrors}
                      customStyle={webComponentThemeStyle}
                      onchange={onChange}
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

          <TabItem key={tabKeys.schema} title="Schema">
            <div class="mb-4 flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold">Schema</Heading>
              <div class="flex gap-2">
                <ToolbarButton size="sm" onclick={reloadMonacoSchema}
                  ><UndoOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>Reload Example Schema</Tooltip>
                <ToolbarButton size="sm" onclick={saveMonacoSchema}
                  ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>Apply Change To Example Schema</Tooltip>
              </div>
            </div>
            <Hr class="my-4" />
            <MonacoEditor
              language="json"
              bind:value={schemaModel}
              style="height: calc(100vh - 100px)"
              editorBeforeMount={registerValidations}
            ></MonacoEditor>
          </TabItem>

          <TabItem key={tabKeys.uiSchema} title="UI Schema">
            <div class="mb-4 flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold">UI Schema</Heading>
              <div class="flex gap-2">
                <ToolbarButton size="sm" onclick={reloadMonacoUiSchema}
                  ><UndoOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>Reload Example UI Schema</Tooltip>
                <ToolbarButton size="sm" onclick={saveMonacoUiSchema}
                  ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>Apply Change To Example UI Schema</Tooltip>
              </div>
            </div>
            <Hr class="my-4" />
            <MonacoEditor
              language="json"
              bind:value={uischemaModel}
              style="height: calc(100vh - 100px)"
              editorBeforeMount={registerValidations}
            ></MonacoEditor>
          </TabItem>

          <TabItem key={tabKeys.uiSchemas} title="UI Schemas">
            <div class="mb-4 flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold">UI Schemas</Heading>
              <div class="flex gap-2">
                <ToolbarButton size="sm" onclick={reloadMonacoUiSchemas}
                  ><UndoOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>Reload Example UI Schemas</Tooltip>
                <ToolbarButton size="sm" onclick={saveMonacoUiSchemas}
                  ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>Apply Change To Example UI Schemas</Tooltip>
              </div>
            </div>
            <Hr class="my-4" />
            <MonacoEditor
              language="json"
              bind:value={uischemasModel}
              style="height: calc(100vh - 100px)"
              editorBeforeMount={registerValidations}
            ></MonacoEditor>
          </TabItem>

          <TabItem key={tabKeys.internationalization} title="Internationalization">
            <div class="mb-4 flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold">Internationalization</Heading>
              <div class="flex gap-2">
                <ToolbarButton size="sm" onclick={reloadMonacoI18n}
                  ><UndoOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>Reload Example Internationalization</Tooltip>
                <ToolbarButton size="sm" onclick={saveMonacoI18n}
                  ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>Apply Change To Example Internationalization</Tooltip>
              </div>
            </div>
            <Hr class="my-4" />
            <MonacoEditor
              language="json"
              bind:value={i18nModel}
              style="height: calc(100vh - 100px)"
              editorBeforeMount={registerValidations}
            ></MonacoEditor>
          </TabItem>

          <TabItem key={tabKeys.config} title="Config">
            <div class="mb-4 flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold">Config</Heading>
              <div class="flex gap-2">
                <ToolbarButton size="sm" onclick={reloadMonacoConfig}
                  ><UndoOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>Reload Example Config</Tooltip>
                <ToolbarButton size="sm" onclick={saveMonacoConfig}
                  ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                >
                <Tooltip>Apply Change To Example Config</Tooltip>
              </div>
            </div>
            <Hr class="my-4" />
            <MonacoEditor
              language="json"
              bind:value={configModel}
              style="height: calc(100vh - 100px)"
              editorBeforeMount={registerValidations}
            ></MonacoEditor>
          </TabItem>

          {#if appStore.layout.value !== 'demo-and-data'}
            <TabItem key={tabKeys.data} title="Data">
              <div class="mb-4 flex items-center justify-between">
                <Heading tag="h6" class="text-xl font-bold">Data</Heading>
                <div class="flex gap-2">
                  <ToolbarButton size="sm" onclick={reloadMonacoData}
                    ><UndoOutline class="h-5 w-5" /></ToolbarButton
                  >
                  <Tooltip>Reload Example Data</Tooltip>
                  <ToolbarButton size="sm" onclick={saveMonacoData}
                    ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
                  >
                  <Tooltip>Apply Change To Example Data</Tooltip>
                </div>
              </div>
              <Hr class="my-4" />
              <MonacoEditor
                language="json"
                bind:value={dataModel}
                style="height: calc(100vh - 200px)"
                editorBeforeMount={registerValidations}
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
              uischema={jsonFormsPropsForRender.uischema}
              uischemas={jsonFormsPropsForRender.uischemas}
              config={jsonFormsPropsForRender.config}
              readonly={jsonFormsPropsForRender.readonly}
              validationMode={jsonFormsPropsForRender.validationMode}
              locale={appStore.jsonforms.locale.value}
              mode={effectiveFormMode}
              translations={activeTranslations}
              additionalErrors={jsonFormsPropsForRender.additionalErrors}
              customStyle={webComponentThemeStyle}
              onchange={onChange}
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
                context={formContext}
                onhandleaction={onHandleAction}
              />
            </div>
          {/if}
        {/if}
      </div>
    {/if}
    {#if snackbar}
      <Toast bind:toastStatus={snackbar} dismissable={true} position="top-right" class="z-50">
        <div class="flex items-center gap-2">
          <InfoCircleOutline class="h-5 w-5 text-primary-500" />
          <span>{snackbarText}</span>
        </div>
      </Toast>
    {/if}
  </div>
{/if}
