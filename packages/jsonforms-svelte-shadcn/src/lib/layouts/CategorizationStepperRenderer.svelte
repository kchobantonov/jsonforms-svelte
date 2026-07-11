<script lang="ts">
  import {
    DispatchRenderer,
    useJsonFormsCategorization,
    useTranslator,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import { Button } from '$lib/components/ui/button';
  import * as Tabs from '$lib/components/ui/tabs';
  import { useShadcnLayout } from '../util';

  const props: RendererProps<Layout> = $props();
  const binding = useShadcnLayout(useJsonFormsCategorization(props));
  const t = useTranslator();
  const categories = $derived(binding.categories.filter((category) => category.visible));
  let step = $state(0);
</script>

{#if binding.layout.visible}
  <div class={binding.styles.categorization.root}>
    <Tabs.Root
      value={step.toString()}
      onValueChange={(value) => (step = Number(value))}
      class="w-full"
      {...binding.shadcnProps('Tabs')}
    >
      <Tabs.List
        class="grid h-auto w-full"
        style={`grid-template-columns: repeat(${Math.max(categories.length, 1)}, minmax(0, 1fr));`}
      >
        {#each categories as category, index (index)}
          <Tabs.Trigger value={index.toString()} class="h-auto gap-2 py-2">
            <span
              class="bg-muted text-muted-foreground group-data-[state=active]:bg-primary group-data-[state=active]:text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs"
            >
              {index + 1}
            </span>
            {category.label}
          </Tabs.Trigger>
        {/each}
      </Tabs.List>

      {#each categories as category, index (index)}
        <Tabs.Content value={index.toString()}>
          <DispatchRenderer
            schema={binding.layout.schema}
            uischema={category.uischema}
            path={binding.layout.path}
            enabled={binding.layout.enabled}
            renderers={binding.layout.renderers}
            cells={binding.layout.cells}
          />
        </Tabs.Content>
      {/each}

      {#if binding.appliedOptions.showNavButtons}
        <div class="mt-8 flex items-center justify-between gap-2">
          <Button variant="outline" disabled={step <= 0} onclick={() => (step -= 1)}>
            {t.value('Previous', 'Previous')}
          </Button>
          <Button disabled={step >= categories.length - 1} onclick={() => (step += 1)}>
            {t.value('Next', 'Next')}
          </Button>
        </div>
      {/if}
    </Tabs.Root>
  </div>
{/if}
