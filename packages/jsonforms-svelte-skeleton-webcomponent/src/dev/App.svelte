<script lang="ts">
  import { tick } from 'svelte';
  import { DarkMode } from '@chobantonov/jsonforms-svelte-skeleton';
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

  const themes = [
    'catppuccin',
    'cerberus',
    'concord',
    'crimson',
    'fennec',
    'hamlindigo',
    'legacy',
    'mint',
    'modern',
    'mona',
    'nosh',
    'nouveau',
    'pine',
    'reign',
    'rocket',
    'rose',
    'sahara',
    'seafoam',
    'terminus',
    'vintage',
    'vox',
    'wintry',
  ];

  let selectedExampleName = $state(examples[0]?.name ?? '');
  let mode = $state<'light' | 'dark' | 'system'>('system');
  let selectedTheme = $state('cerberus');
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
    selectedExampleName;
    applyExample();
  });

  $effect(() => {
    if (!formEl) return;
    formEl.mode = mode;
    formEl.theme = selectedTheme;
  });
</script>

<main class="mx-auto max-w-7xl p-6">
  <div class="card space-y-6 p-6">
    <h1 class="text-2xl font-semibold">JSONForms Skeleton Web Component Playground</h1>

    <div class="grid gap-4 md:grid-cols-4 md:items-end">
      <div>
        <label for="example-select" class="label mb-2">Example</label>
        <select id="example-select" class="select w-full" bind:value={selectedExampleName}>
          {#each examples as example}
            <option value={example.name}>{example.label}</option>
          {/each}
        </select>
      </div>

      <div>
        <label for="theme-select" class="label mb-2">Theme</label>
        <select id="theme-select" class="select w-full" bind:value={selectedTheme}>
          {#each themes as theme}
            <option value={theme}>{theme}</option>
          {/each}
        </select>
      </div>

      <div class="flex items-center gap-3">
        <DarkMode bind:mode cycleMode={true} class="btn preset-tonal" />
        <span class="text-sm font-semibold uppercase">{mode}</span>
      </div>

      <button type="button" class="btn preset-filled" onclick={reloadExample}>Reload Example</button
      >
    </div>

    <p class="text-surface-600-400 text-sm">{loadedExampleText}</p>

    <jsonforms-svelte-skeleton
      bind:this={formEl}
      {mode}
      theme={selectedTheme}
      onchange={onChange}
    ></jsonforms-svelte-skeleton>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="card p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Data</h2>
        <pre
          class="bg-surface-900 text-surface-50 m-0 max-h-80 overflow-auto rounded p-3 text-xs">{eventData}</pre>
      </div>

      <div class="card p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Errors</h2>
        <pre
          class="bg-surface-900 text-surface-50 m-0 max-h-80 overflow-auto rounded p-3 text-xs">{eventErrors}</pre>
      </div>
    </div>
  </div>
</main>
