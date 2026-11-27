<script lang="ts">
  import { EditorActionIcon } from '@chobantonov/jsonforms-svelte-demo-common';
  import { DemoExampleForm, DemoExampleFrame } from '@chobantonov/jsonforms-svelte-demo-common';
  import { DemoValidationStatus } from '@chobantonov/jsonforms-svelte-demo-common';
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { page } from '$app/state';
  import type WebComponentWrapper from '$lib/components/JsonFormsWebComponentWrapper.svelte';
  import MonacoEditor from './MonacoEditor.svelte';
  import { useAppStore } from '$lib/store/index.svelte';
  import { DemoExamplePanels } from '@chobantonov/jsonforms-svelte-demo-common';
  import {
    useExamplePage,
    createShadcnDemoExamples,
  } from '@chobantonov/jsonforms-svelte-demo-common';
  import type { JsonFormsProps } from '@chobantonov/jsonforms-svelte-extended';
  import { Pane, SplitPane, ValidationIcon } from '@chobantonov/jsonforms-svelte-shadcn';
  import { RotateCcwIcon, SaveIcon } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Button, Tabs } from '@jsonforms-svelte-shadcn-ui';

  let {
    JsonFormsWebComponentWrapper,
    renderers,
    cells,
    externalPlayground = false,
  }: {
    JsonFormsWebComponentWrapper: typeof WebComponentWrapper;
    renderers: JsonFormsProps['renderers'];
    cells: JsonFormsProps['cells'];
    externalPlayground?: boolean;
  } = $props();
  const appStore = useAppStore();
  const translateDemo = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  const examples = createShadcnDemoExamples(() => appStore.jsonforms.locale.value);
  const model = useExamplePage(appStore, examples, {
    get name() {
      return page.params.name;
    },
    get externalPlayground() {
      return externalPlayground;
    },
    get renderers() {
      return renderers;
    },
    get cells() {
      return cells;
    },
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
  <Button variant="outline" size="icon" {onclick} {disabled} {title}
    ><EditorActionIcon {save} Save={SaveIcon} Reload={RotateCcwIcon} /></Button
  >
{/snippet}

{#snippet exampleForm()}
  <DemoExampleForm {model} class="text-foreground">
    {#snippet webForm(form, example)}
      <JsonFormsWebComponentWrapper
        {...model.webFormProps}
        {...externalPlayground ? { external: form.external } : {}}
        theme={appStore.theme.value}
        designSystem={appStore.designSystem.value}
        externalSchemas={example.externalSchemas}
        customStyle=""
      />
    {/snippet}
  </DemoExampleForm>
{/snippet}

<DemoExampleFrame
  {model}
  name={page.params.name}
  library="Shadcn"
  locale={appStore.jsonforms.locale.value}
  formOnly={appStore.formOnly.value}
  wideHeading={externalPlayground}
  errorClass="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-6"
  titleClass="text-foreground text-3xl font-semibold"
  toastClass="border-border bg-popover text-popover-foreground rounded-md border px-4 py-3 text-sm shadow-lg"
>
  {#snippet children(example)}
    {#if appStore.formOnly.value}
      <section
        class="border-border bg-card text-card-foreground rounded-lg border p-6 shadow-sm"
        class:overflow-visible={shouldUseWebComponentView}
        data-mode={formModeOverride}
      >
        {@render exampleForm()}
      </section>
    {:else}
      <section
        class="border-border bg-card text-card-foreground rounded-lg border shadow-sm"
        class:overflow-hidden={!appStore.useWebComponentView.value}
        class:overflow-visible={appStore.useWebComponentView.value}
      >
        {#key model.jsonFormsProps?.uischema}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <div class="border-border border-b px-5 py-5">
              <div class="overflow-x-auto overflow-y-hidden pb-1">
                <Tabs.List variant="line" class="flex w-full min-w-max justify-between gap-6">
                  <div class="flex shrink-0 items-center gap-2">
                    <Tabs.Trigger class="flex-none px-3" value={tabValues.demo}>
                      {demoTabLabel}
                    </Tabs.Trigger>
                    <ValidationIcon {errors} data-testid="form-validation-errors" />
                    <DemoValidationStatus
                      {model}
                      {translateDemo}
                      class="text-muted-foreground text-xs"
                    />
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
                    {#if externalPlayground && example.configuration}<Tabs.Trigger
                        value={tabValues.external}
                        >{translateDemo('editor.external.label')}</Tabs.Trigger
                      >{/if}
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

              <DemoExamplePanels
                {model}
                Content={Tabs.Content}
                {SplitPane}
                {Pane}
                {MonacoEditor}
                {editorButton}
                {exampleForm}
                external={externalPlayground && !!example.configuration}
                formClass="border-border bg-card text-card-foreground rounded-lg border p-6 shadow-sm"
                editorClass="border-border bg-card overflow-hidden rounded-lg border"
              >
                {#snippet button(label, onclick)}<Button {onclick}>{label}</Button>{/snippet}
              </DemoExamplePanels>
            </div>
          </Tabs.Root>
        {/key}
      </section>
    {/if}
  {/snippet}
</DemoExampleFrame>
