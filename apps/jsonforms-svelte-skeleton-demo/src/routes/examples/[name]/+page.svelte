<script lang="ts">
  import { EditorActionIcon } from '@chobantonov/jsonforms-svelte-demo-common';
  import { DemoExampleForm, DemoExampleFrame } from '@chobantonov/jsonforms-svelte-demo-common';
  import { DemoValidationStatus } from '@chobantonov/jsonforms-svelte-demo-common';
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { page } from '$app/state';
  import JsonFormsWebComponentWrapper from '$lib/components/JsonFormsWebComponentWrapper.svelte';
  import MonacoEditor from '$lib/components/MonacoEditor.svelte';
  import { getWebComponentThemeStyle, useAppStore } from '$lib/store/index.svelte';
  import { DemoExamplePanels } from '@chobantonov/jsonforms-svelte-demo-common';
  import {
    useExamplePage,
    createSkeletonDemoExamples,
  } from '@chobantonov/jsonforms-svelte-demo-common';
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
  import { RotateCcwIcon, SaveIcon } from '@lucide/svelte';
  import { Tabs } from '@skeletonlabs/skeleton-svelte';

  const appStore = useAppStore();
  const translateDemo = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  const examples = createSkeletonDemoExamples(() => appStore.jsonforms.locale.value);
  const webComponentThemeStyle = $derived(getWebComponentThemeStyle());
  const model = useExamplePage(appStore, examples, {
    get name() {
      return page.params.name;
    },
    externalPlayground: true,
    renderers: [...skeletonRenderers, ...skeletonExtendedRenderers],
    cells: [...skeletonCells, ...skeletonExtendedCells],
  });
  const {
    formModeOverride,
    tabValues,
    errors,
    activeTab,
    demoTabLabel,
    shouldUseWebComponentView,
    setActiveTab,
  } = $derived(model);
</script>

{#snippet editorButton(save: boolean, title: string, onclick: () => void, disabled: boolean)}
  <button type="button" class="btn-icon hover:preset-tonal" {onclick} {disabled} {title}
    ><EditorActionIcon {save} Save={SaveIcon} Reload={RotateCcwIcon} /></button
  >
{/snippet}

{#snippet exampleForm()}
  <DemoExampleForm {model} class="text-surface-950-50">
    {#snippet webForm(form, example)}
      <JsonFormsWebComponentWrapper
        {...model.webFormProps}
        external={form.external}
        theme={appStore.theme.value}
        externalSchemas={example.externalSchemas}
        customStyle={webComponentThemeStyle}
      />
    {/snippet}
  </DemoExampleForm>
{/snippet}

<DemoExampleFrame
  {model}
  name={page.params.name}
  library="Skeleton"
  locale={appStore.jsonforms.locale.value}
  formOnly={appStore.formOnly.value}
  wideHeading
  dir={appStore.rtl ? 'rtl' : 'ltr'}
  errorClass="card preset-tonal-error p-6"
  titleClass="text-surface-950-50 text-3xl font-semibold"
  toastClass="rounded-container border-surface-200-800 bg-surface-50-950 border px-4 py-3 text-sm shadow-lg"
>
  {#snippet children(example)}
    {#if appStore.formOnly.value}
      <section
        class="card preset-filled-surface-50-950 text-surface-950-50 p-6"
        class:overflow-visible={shouldUseWebComponentView}
        data-mode={formModeOverride}
      >
        {@render exampleForm()}
      </section>
    {:else}
      <section
        class="card preset-outlined-surface-200-800"
        class:overflow-hidden={!appStore.useWebComponentView.value}
        class:overflow-visible={appStore.useWebComponentView.value}
      >
        {#key model.jsonFormsProps?.uischema}
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
                  <DemoValidationStatus {model} {translateDemo} class="text-xs opacity-70" />
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
                  {#if example.configuration}<Tabs.Trigger value={tabValues.external}
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

              <DemoExamplePanels
                {model}
                Content={Tabs.Content}
                {SplitPane}
                {Pane}
                {MonacoEditor}
                {editorButton}
                {exampleForm}
                external={!!example.configuration}
                formClass="card preset-filled-surface-50-950 text-surface-950-50 p-6"
                editorClass="card preset-outlined-surface-200-800 overflow-hidden"
              >
                {#snippet button(label, onclick)}<button
                    type="button"
                    class="btn preset-filled"
                    {onclick}>{label}</button
                  >{/snippet}
              </DemoExamplePanels>
            </div>
          </Tabs>
        {/key}
      </section>
    {/if}
  {/snippet}
</DemoExampleFrame>
