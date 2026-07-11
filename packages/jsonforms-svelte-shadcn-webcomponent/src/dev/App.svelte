<script lang="ts">
  import { tick } from 'svelte';
  import {
    Button,
    Card,
    DarkMode,
    Label,
    NativeSelect,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { examples } from './examples/index.js';
  import '../lib/webcomponent-register.js';

  type JsonFormsElement = HTMLElement & {
    schema?: string;
    uischema?: string;
    uischemas?: string;
    data?: string;
    config?: string;
    translations?: string;
    mode?: string | boolean;
    theme?: string;
  };

  const themes = ['slate', 'zinc', 'neutral', 'stone', 'red', 'orange', 'green', 'blue'];

  let selectedExampleName = $state(examples[0]?.name ?? '');
  let mode = $state<'light' | 'dark' | 'system'>('system');
  let selectedTheme = $state('slate');
  let loadedExampleText = $state('');
  let eventData = $state('No change events yet.');
  let eventErrors = $state('No validation errors yet.');
  let formEl = $state<JsonFormsElement | null>(null);

  const selectedExample = $derived.by(() =>
    examples.find((example) => example.name === selectedExampleName),
  );

  const applyExample = () => {
    const example = selectedExample ?? examples[0];
    if (!formEl || !example) return;

    formEl.schema = JSON.stringify(example.input.schema ?? {});
    formEl.uischema = JSON.stringify(example.input.uischema ?? {});
    formEl.uischemas = JSON.stringify(example.input.uischemas ?? []);
    formEl.data = JSON.stringify(example.input.data ?? {});
    formEl.config = JSON.stringify(example.input.config ?? {});
    formEl.translations = JSON.stringify(example.input.i18n ?? {});
    formEl.mode = mode;
    formEl.theme = selectedTheme;

    loadedExampleText = `Loaded example: ${example.label}`;
  };

  const reloadExample = async () => {
    if (!formEl) return;
    formEl.data = undefined;
    await tick();
    applyExample();
  };

  const onChange = (event: Event) => {
    const detail = (event as CustomEvent).detail as {
      data?: unknown;
      errors?: unknown;
    };
    eventData = JSON.stringify(detail?.data ?? null, null, 2);
    eventErrors = JSON.stringify(detail?.errors ?? [], null, 2);
  };

  $effect(() => {
    void selectedExampleName;
    applyExample();
  });

  $effect(() => {
    if (!formEl) return;
    formEl.mode = mode;
    formEl.theme = selectedTheme;
  });
</script>

<main class="mx-auto max-w-7xl p-6">
  <Card.Root class="space-y-6 p-6">
    <h1 class="text-2xl font-semibold">JSONForms Shadcn Web Component Playground</h1>

    <div class="grid gap-4 md:grid-cols-4 md:items-end">
      <div>
        <Label for="example-select" class="mb-2">Example</Label>
        <NativeSelect.Root id="example-select" class="w-full" bind:value={selectedExampleName}>
          {#each examples as example (example.name)}
            <NativeSelect.Option value={example.name}>{example.label}</NativeSelect.Option>
          {/each}
        </NativeSelect.Root>
      </div>

      <div>
        <Label for="theme-select" class="mb-2">Theme</Label>
        <NativeSelect.Root id="theme-select" class="w-full" bind:value={selectedTheme}>
          {#each themes as theme (theme)}
            <NativeSelect.Option value={theme}>{theme}</NativeSelect.Option>
          {/each}
        </NativeSelect.Root>
      </div>

      <div class="flex items-center gap-3">
        <DarkMode
          bind:mode
          cycleMode={true}
          class="border-border hover:bg-muted rounded-md border"
        />
        <span class="text-sm font-semibold uppercase">{mode}</span>
      </div>

      <Button type="button" onclick={reloadExample}>Reload Example</Button>
    </div>

    <p class="text-muted-foreground text-sm">{loadedExampleText}</p>

    <jsonforms-svelte-shadcn bind:this={formEl} {mode} theme={selectedTheme} onchange={onChange}
    ></jsonforms-svelte-shadcn>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card.Root class="p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Data</h2>
        <pre
          class="bg-muted text-foreground m-0 max-h-80 overflow-auto rounded p-3 text-xs">{eventData}</pre>
      </Card.Root>

      <Card.Root class="p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Errors</h2>
        <pre
          class="bg-muted text-foreground m-0 max-h-80 overflow-auto rounded p-3 text-xs">{eventErrors}</pre>
      </Card.Root>
    </div>
  </Card.Root>
</main>
