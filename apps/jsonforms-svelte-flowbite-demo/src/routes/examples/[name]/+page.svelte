<script lang="ts">
  import { DemoPageHead } from '@chobantonov/jsonforms-svelte-demo-common';
  import {
    ExternalEditor,
    PlaygroundConfiguration,
    DemoValidationStatus,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { SplitPane, Pane } from '@chobantonov/jsonforms-svelte-flowbite';
  import { page } from '$app/state';
  import JsonFormsWebComponentWrapper from '$lib/components/JsonFormsWebComponentWrapper.svelte';
  import MonacoEditor from '$lib/components/MonacoEditor.svelte';
  import { getWebComponentThemeStyle, useAppStore } from '$lib/store/index.svelte';
  import { DemoDataSplit } from '@chobantonov/jsonforms-svelte-demo-common';
  import {
    useExamplePage,
    SpecSourceLink,
    createFlowbiteDemoExamples,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  import { JsonForms } from '@chobantonov/jsonforms-svelte-extended';
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
  import { onDestroy, setContext } from 'svelte';

  const appStore = useAppStore();
  const translateDemo = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  const examples = createFlowbiteDemoExamples(() => appStore.jsonforms.locale.value);
  const renderers: JsonFormsRendererRegistryEntry[] = [
    ...flowbiteRenderers,
    ...flowbiteExtendedRenderers,
  ];
  const cells = [...flowbiteCells, ...flowbiteExtendedCells];
  let snackbar = $state(false);
  let snackbarText = $state('');
  let toastTimeout: ReturnType<typeof setTimeout> | null = null;
  onDestroy(() => {
    if (toastTimeout) clearTimeout(toastTimeout);
  });
  const model = useExamplePage(appStore, examples, {
    get name() {
      return page.params.name;
    },
    externalPlayground: true,
    renderers,
    cells,
    notify: toast,
    retainEditorModels: true,
  });
  const {
    currentExample,
    editors,
    jsonFormsPropsForRender,
    isCurrentExampleLoaded,
    shouldUseWebComponentView,
    effectiveFormMode,
    effectiveFormLocale,
    activeTranslations,
    formModeOverride,
    errors,
    tabValues: tabKeys,
  } = $derived(model);
  const webComponentThemeStyle = $derived(getWebComponentThemeStyle(appStore.themeColor.value));

  const myStyles = mergeStyles(defaultStyles, {
    control: { root: 'my-control' },
  });

  setContext(StylesContextSymbol, myStyles);

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

{#snippet editorTab(kind: keyof typeof editors.models)}
  {@const tab = editors.tab(kind)}
  <TabItem key={tab.value} title={tab.label} onclick={() => (appStore.activeTab.value = tab.value)}>
    <div class="mb-4 flex items-center justify-between">
      <Heading tag="h6" class="text-xl font-bold">{tab.label}</Heading>
      <div class="flex gap-2">
        <ToolbarButton size="sm" onclick={() => editors.reload(kind)} aria-label={tab.reloadLabel}
          ><UndoOutline class="h-5 w-5" /></ToolbarButton
        >
        <Tooltip>{tab.reloadLabel}</Tooltip>
        <ToolbarButton size="sm" onclick={() => editors.apply(kind)} aria-label={tab.applyLabel}
          ><FloppyDiskOutline class="h-5 w-5" /></ToolbarButton
        >
        <Tooltip>{tab.applyLabel}</Tooltip>
      </div>
    </div>
    <Hr class="my-4" />
    <MonacoEditor
      language="json"
      bind:value={editors.models[kind]}
      style={kind === 'data' ? 'height: calc(100vh - 200px)' : 'height: calc(100vh - 100px)'}
      editorBeforeMount={editors.registerValidations}
    ></MonacoEditor>
  </TabItem>
{/snippet}

{#snippet exampleForm(withExternalSchemas: boolean)}
  {#if jsonFormsPropsForRender}
    {#if shouldUseWebComponentView}
      <JsonFormsWebComponentWrapper
        {...jsonFormsPropsForRender}
        {...withExternalSchemas ? { externalSchemas: currentExample?.externalSchemas } : {}}
        locale={effectiveFormLocale}
        mode={effectiveFormMode}
        translations={activeTranslations}
        customStyle={webComponentThemeStyle}
        {...model.formEvents}
      />
    {:else}
      <div
        class="rounded-xl bg-gray-50 text-gray-900 dark:bg-gray-800 dark:text-gray-200"
        class:light={formModeOverride === 'light'}
        class:dark={formModeOverride === 'dark'}
      >
        <JsonForms {...model.nativeFormProps(jsonFormsPropsForRender)} />
      </div>
    {/if}
  {/if}
{/snippet}

<DemoPageHead title={translateDemo('example.pageTitle', undefined, { library: 'Flowbite' })} />

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
    class={model.playgroundConfiguration
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
                <DemoValidationStatus {model} {translateDemo} class="text-xs opacity-70" />
              </div>
            {/snippet}

            <div class="flex items-center justify-between">
              <Heading tag="h6" class="text-xl font-bold">JSON Forms</Heading>
              {#if currentExample.actions}
                <div class="flex gap-2">
                  {#each currentExample.actions as action, index (index)}
                    <Button onclick={() => model.applyExampleAction(action)}>
                      {action.label}
                    </Button>
                  {/each}
                </div>
              {/if}
            </div>

            <Hr class="my-4" />

            {#if appStore.layout.value === 'demo-and-data'}
              <div class="min-h-0 min-w-0">
                <DemoDataSplit {SplitPane} {Pane} locale={appStore.jsonforms.locale.value}>
                  {#snippet form()}
                    <div class="mb-4 flex items-center justify-between">
                      <Heading tag="h6" class="text-lg font-semibold"
                        >{translateDemo('editor.demo.label')}</Heading
                      >
                    </div>
                    <Hr class="my-4" />
                    <div class="json-forms">
                      {@render exampleForm(false)}
                    </div>
                  {/snippet}
                  {#snippet data()}
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
                  {/snippet}
                </DemoDataSplit>
              </div>
            {:else}
              <div class="json-forms">
                {@render exampleForm(true)}
              </div>
            {/if}
          </TabItem>

          <div class="flex-1"></div>

          {@render editorTab('schema')}

          {@render editorTab('uischema')}

          {@render editorTab('uischemas')}

          {@render editorTab('i18n')}

          {@render editorTab('config')}

          {#if currentExample.configuration}
            <TabItem
              key={tabKeys.external}
              title={translateDemo('editor.external.label')}
              onclick={() => (appStore.activeTab.value = tabKeys.external)}
              ><ExternalEditor
                editor={MonacoEditor}
                editorStyle="height: calc(100vh - 100px)"
                bind:value={model.externalModel}
                {...model.externalEditorProps}
              >
                {#snippet header(apply, invalidDraft)}
                  <div class="mb-4 flex items-center justify-between">
                    <Heading tag="h6" class="text-xl font-bold"
                      >{translateDemo('editor.external.label')}</Heading
                    >
                    <div class="flex gap-2">
                      <ToolbarButton
                        size="sm"
                        onclick={model.reloadExternal}
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
            {@render editorTab('data')}
          {/if}
        </Tabs>
      </Card>
    {:else}
      <div class="json-forms px-2 pt-2 sm:px-0 sm:pt-0">
        {@render exampleForm(true)}
      </div>
    {/if}
    <PlaygroundConfiguration {model} />
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
