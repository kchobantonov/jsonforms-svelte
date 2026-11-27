<script lang="ts">
  import ExampleOptions from '../../../jsonforms-svelte-demo-common/src/dev/ExampleOptions.svelte';
  import { usePlayground } from '../../../jsonforms-svelte-demo-common/src/dev/playground.svelte';
  import { DarkMode } from '@chobantonov/jsonforms-svelte-flowbite';
  import { Button, Card, Label, Select } from 'flowbite-svelte';
  import { examples } from './examples/index.js';
  import '../lib/webcomponent-register.js';

  const playground = usePlayground(examples);
</script>

<main class="mx-auto max-w-7xl p-6">
  <Card class="min-w-full space-y-6 p-6">
    <h1 class="text-2xl font-semibold">JSONForms Web Component Playground</h1>

    <div class="grid gap-4 md:grid-cols-3 md:items-end">
      <div>
        <Label for="example-select" class="mb-2 block">Example</Label>
        <Select id="example-select" bind:value={playground.selectedExampleName}>
          <ExampleOptions {examples} />
        </Select>
      </div>

      <div class="flex items-end gap-3">
        <DarkMode bind:mode={playground.mode} cycleMode={true} />
        <Label class="pb-2 uppercase">{playground.mode}</Label>
      </div>

      <Button color="primary" onclick={playground.reloadExample}>Reload Example</Button>
    </div>

    <p class="text-sm text-gray-600">{playground.loadedExampleText}</p>

    <jsonforms-svelte-flowbite
      bind:this={playground.formEl}
      mode={playground.mode}
      onchange={playground.onChange}
    ></jsonforms-svelte-flowbite>

    <div class="grid gap-4 lg:grid-cols-2">
      <Card class="p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Data</h2>
        <pre
          class="m-0 max-h-80 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-50">{playground.eventData}</pre>
      </Card>

      <Card class="p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Errors</h2>
        <pre
          class="m-0 max-h-80 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-50">{playground.eventErrors}</pre>
      </Card>
    </div>
  </Card>
</main>
