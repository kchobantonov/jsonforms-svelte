<script lang="ts">
  import { tick } from 'svelte';
  import { DarkMode } from '@chobantonov/jsonforms-svelte-flowbite';
  import { Button, Card, Label, Select } from 'flowbite-svelte';
  import { examples } from './examples/index.js';
  import '../lib/webcomponent-register.js';

  type JsonFormsElement = HTMLElement & {
    schema?: string;
    uischema?: string;
    uischemas?: string;
    data?: string;
    config?: string;
    translations?: string;
    dark?: string | boolean;
  };

  let selectedExampleName = $state(examples[0]?.name ?? '');
  let darkMode = $state<'auto' | 'true' | 'false'>('auto');
  let themeMode = $state<'light' | 'dark' | 'system'>('system');
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
    formEl.dark = darkMode;

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
    selectedExampleName;
    applyExample();
  });

  $effect(() => {
    darkMode = themeMode === 'system' ? 'auto' : themeMode === 'dark' ? 'true' : 'false';
  });

  $effect(() => {
    if (!formEl) return;
    formEl.dark = darkMode;
  });
</script>

<main class="mx-auto max-w-7xl p-6">
  <Card class="min-w-full space-y-6 p-6">
    <h1 class="text-2xl font-semibold">JSONForms Web Component Playground</h1>

    <div class="grid gap-4 md:grid-cols-3 md:items-end">
      <div>
        <Label for="example-select" class="mb-2 block">Example</Label>
        <Select id="example-select" bind:value={selectedExampleName}>
          {#each examples as example}
            <option value={example.name}>{example.label}</option>
          {/each}
        </Select>
      </div>

      <div class="flex items-end gap-3">
        <DarkMode bind:mode={themeMode} cycleMode={true} />
        <Label class="pb-2 uppercase">{themeMode}</Label>
      </div>

      <Button color="primary" onclick={reloadExample}>Reload Example</Button>
    </div>

    <p class="text-sm text-gray-600">{loadedExampleText}</p>

    <jsonforms-svelte-flowbite bind:this={formEl} dark={darkMode} onchange={onChange}
    ></jsonforms-svelte-flowbite>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card class="p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Data</h2>
        <pre
          class="m-0 max-h-80 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-50">{eventData}</pre>
      </Card>

      <Card class="p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Errors</h2>
        <pre
          class="m-0 max-h-80 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-50">{eventErrors}</pre>
      </Card>
    </div>
  </Card>
</main>
