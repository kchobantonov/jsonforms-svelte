<script lang="ts">
  import { themes } from '$lib/modules/themes';
  import { useAppStore } from '$lib/store/index.svelte';
  import {
    ArrowUpRightIcon,
    LaptopMinimalCheckIcon,
    MoonIcon,
    PaletteIcon,
    SunIcon,
  } from '@lucide/svelte';
  import { Button, Popover, ToggleGroup } from '@chobantonov/jsonforms-svelte-shadcn';

  const appStore = useAppStore();
</script>

<Popover.Root>
  <Popover.Trigger
    class="size-9 px-0 hover:bg-accent data-[state=open]:bg-accent"
    aria-label="Theme"
    title="Theme"
  >
    <PaletteIcon class="size-4" />
  </Popover.Trigger>
  <Popover.Content
    align="end"
    sideOffset={8}
    class="max-h-[75vh] w-[min(92vw,52rem)] overflow-y-auto p-3"
  >
    <div class="space-y-4">
      <div>
        <ToggleGroup.Root
          type="single"
          variant="outline"
          value={appStore.mode.value}
          onValueChange={(value) => {
            if (value) appStore.mode.value = value as typeof appStore.mode.value;
          }}
          class="w-full"
        >
          <ToggleGroup.Item value="system" class="flex-1">
            <LaptopMinimalCheckIcon class="size-4" />
            <span>System</span>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="light" class="flex-1">
            <SunIcon class="size-4" />
            <span>Light</span>
          </ToggleGroup.Item>
          <ToggleGroup.Item value="dark" class="flex-1">
            <MoonIcon class="size-4" />
            <span>Dark</span>
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>

      <div class="grid grid-cols-1 gap-2 lg:grid-cols-3">
        {#each themes as theme (theme.name)}
          <Button
            variant="outline"
            data-theme={theme.name}
            class={`grid h-auto grid-cols-[auto_1fr_auto] items-center gap-4 p-3 text-start ${
              appStore.theme.value === theme.name
                ? 'border-primary ring-1 ring-primary'
                : 'border-border'
            }`}
            onclick={() => (appStore.theme.value = theme.name)}
          >
            <span>{theme.emoji}</span>
            <h3 class="text-sm font-bold capitalize">{theme.name}</h3>
            <div class="flex items-center justify-center -space-x-1.5">
              <div class="aspect-square w-4 rounded-full border border-black/10 bg-primary"></div>
              <div class="aspect-square w-4 rounded-full border border-black/10 bg-secondary"></div>
              <div class="aspect-square w-4 rounded-full border border-black/10 bg-accent"></div>
            </div>
          </Button>
        {/each}
      </div>

      <div class="mx-auto flex justify-center rounded-md bg-muted py-4">
        <Button
          href="https://themes.shadcn.dev/"
          target="_blank"
          rel="noreferrer"
          class="items-center gap-2"
        >
          <span>Create a Theme</span>
          <ArrowUpRightIcon class="size-4" />
        </Button>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>
