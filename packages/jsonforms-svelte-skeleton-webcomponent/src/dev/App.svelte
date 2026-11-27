<script lang="ts">
  import ExampleOptions from '../../../jsonforms-svelte-demo-common/src/dev/ExampleOptions.svelte';
  import { usePlayground } from '../../../jsonforms-svelte-demo-common/src/dev/playground.svelte';
  import { DarkMode } from '@chobantonov/jsonforms-svelte-skeleton';
  import { examples } from './examples/index.js';
  import '../lib/webcomponent-register.js';

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

  const playground = usePlayground(examples, 'cerberus');
</script>

<main class="mx-auto max-w-7xl p-6">
  <div class="card space-y-6 p-6">
    <h1 class="text-2xl font-semibold">JSONForms Skeleton Web Component Playground</h1>

    <div class="grid gap-4 md:grid-cols-4 md:items-end">
      <div>
        <label for="example-select" class="label mb-2">Example</label>
        <select
          id="example-select"
          class="select w-full"
          bind:value={playground.selectedExampleName}
        >
          <ExampleOptions {examples} />
        </select>
      </div>

      <div>
        <label for="theme-select" class="label mb-2">Theme</label>
        <select id="theme-select" class="select w-full" bind:value={playground.selectedTheme}>
          {#each themes as theme (theme)}
            <option value={theme}>{theme}</option>
          {/each}
        </select>
      </div>

      <div class="flex items-center gap-3">
        <DarkMode bind:mode={playground.mode} cycleMode={true} class="btn preset-tonal" />
        <span class="text-sm font-semibold uppercase">{playground.mode}</span>
      </div>

      <button type="button" class="btn preset-filled" onclick={playground.reloadExample}
        >Reload Example</button
      >
    </div>

    <p class="text-surface-600-400 text-sm">{playground.loadedExampleText}</p>

    <jsonforms-svelte-skeleton
      bind:this={playground.formEl}
      mode={playground.mode}
      theme={playground.selectedTheme}
      onchange={playground.onChange}
    ></jsonforms-svelte-skeleton>

    <div class="grid gap-4 lg:grid-cols-2">
      <div class="card p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Data</h2>
        <pre
          class="bg-surface-900 text-surface-50 m-0 max-h-80 overflow-auto rounded p-3 text-xs">{playground.eventData}</pre>
      </div>

      <div class="card p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Errors</h2>
        <pre
          class="bg-surface-900 text-surface-50 m-0 max-h-80 overflow-auto rounded p-3 text-xs">{playground.eventErrors}</pre>
      </div>
    </div>
  </div>
</main>
