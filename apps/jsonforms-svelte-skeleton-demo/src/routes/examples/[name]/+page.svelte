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
    createSkeletonDemoExamples,
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
    Pane,
    SplitPane,
    ValidationIcon,
    skeletonRenderers,
  } from '@chobantonov/jsonforms-svelte-skeleton';
  import { skeletonExtendedRenderers } from '@chobantonov/jsonforms-svelte-skeleton-extended';
  import type { ExampleDescription, StateProps } from '@jsonforms/examples';
  import { RotateCcwIcon, SaveIcon } from '@lucide/svelte';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';
  import type { ErrorObject } from 'ajv';
  import cloneDeep from 'lodash/cloneDeep';
  import find from 'lodash/find';
  import { onDestroy, untrack } from 'svelte';

  const appStore = useAppStore();
  const examples = createSkeletonDemoExamples(() => appStore.jsonforms.locale.value);
  const webComponentThemeStyle = $derived(getWebComponentThemeStyle());

  const currentExample = $derived.by(
    () => examples.find((example) => example.name === page.params.name) as DemoExample | undefined,
  );

  const initialState = (example: ExampleDescription): JsonFormsProps => ({
    ajv: createAjv(example.i18n),
    schema: example.schema,
    uischema: example.uischema,
    data: example.data,
    config: example.config,
    uischemas: example.uischemas,
    i18n: example.i18n,
    renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
    readonly: appStore.jsonforms.readonly.value,
    validationMode: appStore.jsonforms.validationMode,
  });

  let jsonFormsProps = $state<JsonFormsProps | undefined>(undefined);
  let errors = $state<ErrorObject[]>([]);
  let schemaModel = $state<monaco.editor.ITextModel | null>(null);
  let uischemaModel = $state<monaco.editor.ITextModel | null>(null);
  let dataModel = $state<monaco.editor.ITextModel | null>(null);
  let statusMessage = $state('');
  let activeTab = $state<string>('0');
  let previousExampleName = $state<string | undefined>(undefined);

  $effect(() => {
    if (currentExample) {
      jsonFormsProps = initialState(currentExample);
      updateMonacoModels(currentExample);
      errors = [];
      statusMessage = '';
      const storedActiveTab = untrack(() => appStore.activeTab.value as string);
      activeTab =
        storedActiveTab === '1' || storedActiveTab === '2' || storedActiveTab === '3'
          ? storedActiveTab
          : '0';
    } else {
      jsonFormsProps = undefined;
      schemaModel = null;
      uischemaModel = null;
      dataModel = null;
      errors = [];
      statusMessage = '';
    }
  });

  $effect(() => {
    appStore.jsonforms.config;
    if (jsonFormsProps && currentExample) {
      jsonFormsProps.config = { ...currentExample.config, ...appStore.jsonforms.config };
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
    const nextI18n = currentExample?.i18n;

    if (jsonFormsProps && currentExample) {
      jsonFormsProps.i18n = nextI18n;
      jsonFormsProps.ajv = createAjv(nextI18n);
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

  function notify(message: string) {
    statusMessage = message;
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

  function updateMonacoModels(example: ExampleDescription) {
    schemaModel = getMonacoModelForUri(
      monaco.Uri.parse(toSchemaUri(example.name)),
      example.schema ? JSON.stringify(example.schema, null, 2) : '',
    );

    uischemaModel = getMonacoModelForUri(
      monaco.Uri.parse(toUiSchemaUri(example.name)),
      example.uischema ? JSON.stringify(example.uischema, null, 2) : '',
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
    monaco.editor.getModel(monaco.Uri.parse(toDataUri(name)))?.dispose();
  }

  const toSchemaUri = (id: string) => `${id}.schema.json`;
  const toUiSchemaUri = (id: string) => `${id}.uischema.json`;
  const toDataUri = (id: string) => `${id}.data.json`;

  function registerValidations(editor: MonacoApi) {
    configureJsonSchemaValidation(editor, ['*.schema.json']);
    configureUISchemaValidation(editor, ['*.uischema.json']);
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
  }

  const demoTabLabel = $derived(
    appStore.layout.value === 'demo-and-data' ? 'Demo and Data' : 'Demo',
  );

  const tabValues = {
    demo: '0',
    schema: '1',
    uiSchema: '2',
    data: '3',
  };

  function setActiveTab(value: string) {
    activeTab = value;
    appStore.activeTab.value = value as any;
  }

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
  <title>JSON Forms Svelte Skeleton Example</title>
  <meta name="description" content="JSON Forms Svelte Skeleton Example" />
</svelte:head>

{#if currentExample && jsonFormsProps}
  <div class="space-y-6 py-4">
    {#if !appStore.formOnly.value}
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="space-y-1">
          <h1 class="text-3xl font-semibold text-surface-950-50">{currentExample.label}</h1>
        </div>
      </div>
    {/if}

    {#if appStore.formOnly.value}
      <section
        class="card preset-filled-surface-50-950 p-6"
        class:overflow-visible={appStore.useWebComponentView.value}
      >
        {#if appStore.useWebComponentView.value}
          <JsonFormsWebComponentWrapper
            data={jsonFormsProps.data}
            schema={jsonFormsProps.schema}
            uischema={jsonFormsProps.uischema}
            uischemas={jsonFormsProps.uischemas}
            config={jsonFormsProps.config}
            readonly={jsonFormsProps.readonly}
            validationMode={jsonFormsProps.validationMode}
            locale={appStore.jsonforms.locale.value}
            mode={appStore.mode.value}
            theme={appStore.theme.value}
            translations={currentExample.i18n?.translations}
            additionalErrors={jsonFormsProps.additionalErrors}
            customStyle={webComponentThemeStyle}
            onchange={onChange}
            onhandleaction={onHandleAction}
          />
        {:else}
          <JsonForms
            {...jsonFormsProps}
            onchange={onChange}
            context={{ appStore }}
            onhandleaction={onHandleAction}
          />
        {/if}
      </section>
    {:else}
      <section
        class="card preset-outlined-surface-200-800"
        class:overflow-hidden={!appStore.useWebComponentView.value}
        class:overflow-visible={appStore.useWebComponentView.value}
      >
        <Tabs value={activeTab} onValueChange={(details) => setActiveTab(details.value)}>
          <div class="border-b border-surface-200-800 px-5 py-5">
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
              {#if appStore.layout.value !== 'demo-and-data'}
                <Tabs.Trigger value={tabValues.data}>Data</Tabs.Trigger>
              {/if}
              <Tabs.Indicator />
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

              {#if statusMessage}
                <div
                  class="mt-4 rounded-container border border-surface-200-800 bg-surface-100-900 px-4 py-3 text-sm"
                >
                  {statusMessage}
                </div>
              {/if}

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
                        class="mt-4 card preset-filled-surface-50-950 p-6"
                        class:overflow-visible={appStore.useWebComponentView.value}
                      >
                        {#if jsonFormsProps}
                          {#if appStore.useWebComponentView.value}
                            <JsonFormsWebComponentWrapper
                              data={jsonFormsProps.data}
                              schema={jsonFormsProps.schema}
                              uischema={jsonFormsProps.uischema}
                              uischemas={jsonFormsProps.uischemas}
                              config={jsonFormsProps.config}
                              readonly={jsonFormsProps.readonly}
                              validationMode={jsonFormsProps.validationMode}
                              locale={appStore.jsonforms.locale.value}
                              mode={appStore.mode.value}
                              theme={appStore.theme.value}
                              translations={currentExample.i18n?.translations}
                              additionalErrors={jsonFormsProps.additionalErrors}
                              customStyle={webComponentThemeStyle}
                              onchange={onChange}
                              onhandleaction={onHandleAction}
                            />
                          {:else}
                            <JsonForms
                              {...jsonFormsProps}
                              onchange={onChange}
                              context={{ appStore }}
                              onhandleaction={onHandleAction}
                            />
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
                          <button
                            type="button"
                            class="btn-icon hover:preset-tonal"
                            onclick={reloadMonacoData}
                            title="Reload example data"
                          >
                            <RotateCcwIcon class="size-4" />
                          </button>
                          <button
                            type="button"
                            class="btn-icon hover:preset-tonal"
                            onclick={saveMonacoData}
                            title="Apply data changes"
                          >
                            <SaveIcon class="size-4" />
                          </button>
                        </div>
                      </div>
                      <div class="mt-4 overflow-hidden card preset-outlined-surface-200-800">
                        <MonacoEditor
                          language="json"
                          bind:value={dataModel}
                          style="height: calc(100vh - 200px)"
                          editorBeforeMount={registerValidations}
                        />
                      </div>
                    </div>
                  </Pane>
                </SplitPane>
              {:else}
                <div class="mt-5 space-y-5">
                  <section
                    class="card preset-filled-surface-50-950 p-6"
                    class:overflow-visible={appStore.useWebComponentView.value}
                  >
                    {#if appStore.useWebComponentView.value}
                      <JsonFormsWebComponentWrapper
                        data={jsonFormsProps.data}
                        schema={jsonFormsProps.schema}
                        uischema={jsonFormsProps.uischema}
                        uischemas={jsonFormsProps.uischemas}
                        config={jsonFormsProps.config}
                        readonly={jsonFormsProps.readonly}
                        validationMode={jsonFormsProps.validationMode}
                        locale={appStore.jsonforms.locale.value}
                        mode={appStore.mode.value}
                        theme={appStore.theme.value}
                        translations={currentExample.i18n?.translations}
                        additionalErrors={jsonFormsProps.additionalErrors}
                        customStyle={webComponentThemeStyle}
                        onchange={onChange}
                        onhandleaction={onHandleAction}
                      />
                    {:else}
                      <JsonForms
                        {...jsonFormsProps}
                        onchange={onChange}
                        context={{ appStore }}
                        onhandleaction={onHandleAction}
                      />
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
                    <button
                      type="button"
                      class="btn-icon hover:preset-tonal"
                      onclick={reloadMonacoSchema}
                      title="Reload example schema"
                    >
                      <RotateCcwIcon class="size-4" />
                    </button>
                    <button
                      type="button"
                      class="btn-icon hover:preset-tonal"
                      onclick={saveMonacoSchema}
                      title="Apply schema changes"
                    >
                      <SaveIcon class="size-4" />
                    </button>
                  </div>
                </div>
                <div class="overflow-hidden card preset-outlined-surface-200-800">
                  <MonacoEditor
                    language="json"
                    bind:value={schemaModel}
                    class="h-[calc(100vh-16rem)] min-h-[480px]"
                    editorBeforeMount={registerValidations}
                  />
                </div>
              </div>
            </Tabs.Content>

            <Tabs.Content value={tabValues.uiSchema} class="pt-5">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <h2 class="text-xl font-bold">UI Schema</h2>
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="btn-icon hover:preset-tonal"
                      onclick={reloadMonacoUiSchema}
                      title="Reload example UI schema"
                    >
                      <RotateCcwIcon class="size-4" />
                    </button>
                    <button
                      type="button"
                      class="btn-icon hover:preset-tonal"
                      onclick={saveMonacoUiSchema}
                      title="Apply UI schema changes"
                    >
                      <SaveIcon class="size-4" />
                    </button>
                  </div>
                </div>
                <div class="overflow-hidden card preset-outlined-surface-200-800">
                  <MonacoEditor
                    language="json"
                    bind:value={uischemaModel}
                    class="h-[calc(100vh-16rem)] min-h-[480px]"
                    editorBeforeMount={registerValidations}
                  />
                </div>
              </div>
            </Tabs.Content>

            {#if appStore.layout.value !== 'demo-and-data'}
              <Tabs.Content value={tabValues.data} class="pt-5">
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <h2 class="text-xl font-bold">Data</h2>
                    <div class="flex gap-2">
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={reloadMonacoData}
                        title="Reload example data"
                      >
                        <RotateCcwIcon class="size-4" />
                      </button>
                      <button
                        type="button"
                        class="btn-icon hover:preset-tonal"
                        onclick={saveMonacoData}
                        title="Apply data changes"
                      >
                        <SaveIcon class="size-4" />
                      </button>
                    </div>
                  </div>
                  <div class="overflow-hidden card preset-outlined-surface-200-800">
                    <MonacoEditor
                      language="json"
                      bind:value={dataModel}
                      class="h-[calc(100vh-16rem)] min-h-[480px]"
                      editorBeforeMount={registerValidations}
                    />
                  </div>
                </div>
              </Tabs.Content>
            {/if}
          </div>
        </Tabs>
      </section>
    {/if}
  </div>
{:else}
  <div class="card preset-tonal-error p-6">
    <p class="text-base font-medium">Example not found: {page.params.name}</p>
  </div>
{/if}
