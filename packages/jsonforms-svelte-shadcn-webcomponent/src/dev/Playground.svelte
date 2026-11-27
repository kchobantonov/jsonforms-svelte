<script lang="ts">
  import { usePlayground } from '../../../jsonforms-svelte-demo-common/src/dev/playground.svelte';
  import { DarkMode } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Card from '@jsonforms-svelte-shadcn-ui/card';
  import { Label } from '@jsonforms-svelte-shadcn-ui/label';
  import * as NativeSelect from '@jsonforms-svelte-shadcn-ui/native-select';
  import { untrack, type Snippet } from 'svelte';
  import type { ExampleDescription } from './examples/types';
  const {
    examples,
    form,
  }: { examples: ExampleDescription[]; form: Snippet<[ReturnType<typeof usePlayground>]> } =
    $props();

  const themes = ['slate', 'zinc', 'neutral', 'stone', 'red', 'orange', 'green', 'blue'];

  const playground = usePlayground(
    untrack(() => examples),
    'slate',
  );
</script>

<main class="mx-auto max-w-7xl p-6">
  <Card.Root class="space-y-6 p-6">
    <h1 class="text-2xl font-semibold">JSONForms Shadcn Web Component Playground</h1>

    <div class="grid gap-4 md:grid-cols-4 md:items-end">
      <div>
        <Label for="example-select" class="mb-2">Example</Label>
        <NativeSelect.Root
          id="example-select"
          class="w-full"
          bind:value={playground.selectedExampleName}
        >
          {#each examples as example (example.name)}
            <NativeSelect.Option value={example.name}>{example.label}</NativeSelect.Option>
          {/each}
        </NativeSelect.Root>
      </div>

      <div>
        <Label for="theme-select" class="mb-2">Theme</Label>
        <NativeSelect.Root id="theme-select" class="w-full" bind:value={playground.selectedTheme}>
          {#each themes as theme (theme)}
            <NativeSelect.Option value={theme}>{theme}</NativeSelect.Option>
          {/each}
        </NativeSelect.Root>
      </div>

      <div class="flex items-center gap-3">
        <DarkMode
          bind:mode={playground.mode}
          cycleMode={true}
          class="border-border hover:bg-muted rounded-md border"
        />
        <span class="text-sm font-semibold uppercase">{playground.mode}</span>
      </div>

      <Button type="button" onclick={playground.reloadExample}>Reload Example</Button>
    </div>

    <p class="text-muted-foreground text-sm">{playground.loadedExampleText}</p>

    {@render form(playground)}

    <div class="grid gap-4 lg:grid-cols-2">
      <Card.Root class="p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Data</h2>
        <pre
          class="bg-muted text-foreground m-0 max-h-80 overflow-auto rounded p-3 text-xs">{playground.eventData}</pre>
      </Card.Root>

      <Card.Root class="p-4">
        <h2 class="mb-3 text-lg font-semibold">Event Errors</h2>
        <pre
          class="bg-muted text-foreground m-0 max-h-80 overflow-auto rounded p-3 text-xs">{playground.eventErrors}</pre>
      </Card.Root>
    </div>
  </Card.Root>
</main>
