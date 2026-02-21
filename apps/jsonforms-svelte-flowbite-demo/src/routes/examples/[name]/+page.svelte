<script lang="ts">
  import { page } from '$app/state';
  import MonacoEditor from '$lib/components/MonacoEditor.svelte';
  import JsonFormsWebComponentWrapper from '$lib/components/JsonFormsWebComponentWrapper.svelte';
  import {
    configureDataValidation,
    configureJsonSchemaValidation,
    configureUISchemaValidation,
    getMonacoModelForUri,
  } from '$lib/core/jsonSchemaValidation';
  import type { MonacoApi } from '$lib/core/monaco';
  import monaco from '$lib/core/monaco';
  import examples from '$lib/examples.js';
  import { useAppStore } from '$lib/store/index.svelte';
  import { createAjv } from '$lib/validate';
  import {
    JsonForms,
    type JsonFormsChangeEvent,
    type JsonFormsProps,
  } from '@chobantonov/jsonforms-svelte';
  import {
    defaultStyles,
    flowbiteRenderers,
    mergeStyles,
    StylesContextSymbol,
    ValidationIcon,
  } from '@chobantonov/jsonforms-svelte-flowbite';
  import type { JsonFormsRendererRegistryEntry } from '@jsonforms/core';
  import type { ExampleDescription, StateProps } from '@jsonforms/examples';
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
  import { FloppyDiskOutline, UndoOutline, InfoCircleOutline } from 'flowbite-svelte-icons';
  import cloneDeep from 'lodash/cloneDeep';
  import find from 'lodash/find';
  import { setContext, untrack } from 'svelte';

  const currentExample = $derived.by(() => examples.find((e) => e.name === page.params.name));
  const ajv = createAjv();

  const initialState = (
    example: ExampleDescription,
    cells?: any,
    renderers?: any,
  ): JsonFormsProps => {
    const schema = example.schema;
    const uischema = example.uischema;
    const data = example.data;
    const config = example.config;
    const uischemas = example.uischemas;
    const i18n = example.i18n;

    return {
      ajv,
      schema,
      uischema,
      data,
      config,
      uischemas,
      cells,
      renderers,
      i18n,
      additionalErrors: undefined,
      middleware: undefined,
    };
  };

  let jsonFormsProps = $state<JsonFormsProps | undefined>(undefined);
  let errors = $state<ErrorObject<string, Record<string, any>, unknown>[]>([]);

  let schemaModel = $state<monaco.editor.ITextModel | null>(null);
  let uischemaModel = $state<monaco.editor.ITextModel | null>(null);
  let dataModel = $state<monaco.editor.ITextModel | null>(null);

  $effect(() => {
    if (currentExample) {
      jsonFormsProps = initialState(currentExample, undefined, renderers);
      updateMonacoModels(currentExample);

      errors = []; // Reset errors when example changes
    } else {
      jsonFormsProps = undefined;
      errors = [];
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

    if (jsonFormsProps && currentExample) {
      jsonFormsProps.readonly = appStore.jsonforms.readonly.value;
    }
  });

  $effect(() => {
    appStore.jsonforms.validationMode;

    if (jsonFormsProps && currentExample) {
      jsonFormsProps.validationMode = appStore.jsonforms.validationMode;
    }
  });

  const renderers: JsonFormsRendererRegistryEntry[] = flowbiteRenderers;
  const appStore = useAppStore();

  const myStyles = mergeStyles(defaultStyles, {
    control: { root: 'my-control' },
  });

  setContext(StylesContextSymbol, myStyles);

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

  type Action = NonNullable<ExampleDescription['actions']>[number];

  const handleAction = (action: Action) => {
    if (jsonFormsProps) {
      jsonFormsProps = action.apply(jsonFormsProps as StateProps);
    }
  };

  let snackbar = $state(false);
  let snackbarText = $state('');
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;

  function toast(message: string, duration = 3000) {
    snackbarText = message;
    snackbar = true;

    // Clear any previous timeout to prevent early hiding
    if (toastTimeout) clearTimeout(toastTimeout);

    // Hide toast after duration
    toastTimeout = setTimeout(() => {
      snackbar = false;
      toastTimeout = null; // reset
    }, duration);
  }

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

  const saveMonacoModel = (
    model: monaco.editor.ITextModel | null,
    apply: (value: string) => void,
    successToast: string,
  ) => {
    if (model) {
      const modelValue = model.getValue();

      try {
        apply(modelValue);
        toast(successToast);
      } catch (error) {
        toast(`Error: ${error}`);
      }
    }
  };

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

  const updateMonacoModels = (example: ExampleDescription) => {
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
  };

  const toSchemaUri = (id: string): string => {
    return `${id}.schema.json`;
  };
  const toUiSchemaUri = (id: string): string => {
    return `${id}.uischema.json`;
  };
  const toDataUri = (id: string): string => {
    return `${id}.data.json`;
  };

  const registerValidations = (editor: MonacoApi) => {
    configureJsonSchemaValidation(editor, ['*.schema.json']);
    configureUISchemaValidation(editor, ['*.uischema.json']);
    for (const example of examples) {
      const schema = {
        ...example.schema,
        title: example.label,
      };

      if (example && example.schema) {
        configureDataValidation(
          editor,
          `inmemory://${toSchemaUri(example.name)}`,
          toDataUri(example.name),
          schema,
        );
      }
    }
  };
</script>

<svelte:head>
  <title>JSON Forms Svelte Example</title>
  <meta name="description" content="JSON Forms Svelte Example" />
</svelte:head>

{#if currentExample === undefined}
  <div class="p-4 text-center">
    <Heading tag="h1" class="text-2xl font-bold text-red-600 dark:text-red-400">
      Example not found: {page.params.name}
    </Heading>
  </div>
{:else}
  {#key currentExample.name}
    <div>
      {#if !appStore.formOnly.value}
        <Card class="min-w-full p-4 sm:p-6 md:p-8">
          <Heading tag="h5" class="mb-4 text-2xl font-bold tracking-tight ">
            {currentExample.label}
          </Heading>

          <Tabs tabStyle="underline" bind:selected={appStore.activeTab.value}>
            <TabItem key="0">
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
                        {#if jsonFormsProps}
                          {#if appStore.useWebComponentView.value}
                            <JsonFormsWebComponentWrapper
                              {...jsonFormsProps}
                              locale={appStore.jsonforms.locale.value}
                              dark={appStore.dark.value ? 'dark' : 'light'}
                              translations={currentExample.i18n?.translations}
                              onchange={onChange}
                            />
                          {:else}
                            <JsonForms {...jsonFormsProps} onchange={onChange} />
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
                        dark={appStore.dark.value ? 'dark' : 'light'}
                        translations={currentExample.i18n}
                        additionalErrors={jsonFormsProps.additionalErrors}
                        onchange={onChange}
                      />
                    {:else}
                      <JsonForms {...jsonFormsProps} onchange={onChange} />
                    {/if}
                  {/if}
                </div>
              {/if}
            </TabItem>

            <div class="flex-1"></div>

            <TabItem key="1" title="Schema">
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

            <TabItem key="2" title="UI Schema">
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

            {#if appStore.layout.value !== 'demo-and-data'}
              <TabItem key="3" title="Data">
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
        <div class="json-forms">
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
                dark={appStore.dark.value ? 'dark' : 'light'}
                translations={currentExample.i18n}
                additionalErrors={jsonFormsProps.additionalErrors}
                onchange={onChange}
              />
            {:else}
              <JsonForms {...jsonFormsProps} onchange={onChange} />
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
  {/key}
{/if}
