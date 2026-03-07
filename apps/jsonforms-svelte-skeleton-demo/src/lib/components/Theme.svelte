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
  import { Popover, Portal, SegmentedControl } from '@skeletonlabs/skeleton-svelte';

  const appStore = useAppStore();
</script>

<Popover>
  <Popover.Trigger
    class="btn px-2 hover:preset-tonal data-[state=open]:preset-tonal"
    aria-label="Theme"
    title="Theme"
  >
    <PaletteIcon class="size-4" />
  </Popover.Trigger>
  <Portal>
    <Popover.Positioner class="z-50">
      <Popover.Content
        class="max-h-[75vh] w-[min(92vw,52rem)] overflow-y-auto card border border-surface-200-800 bg-surface-50-950 p-3 shadow-xl"
      >
        <div class="space-y-4">
          <div>
            <SegmentedControl
              value={appStore.mode.value}
              onValueChange={(details) => {
                if (details.value)
                  appStore.mode.value = details.value as typeof appStore.mode.value;
              }}
              class="w-full bg-surface-50-950"
            >
              <SegmentedControl.Control>
                <SegmentedControl.Indicator />
                <SegmentedControl.Item value="system">
                  <SegmentedControl.ItemText class="flex items-center gap-2">
                    <LaptopMinimalCheckIcon class="size-4" />
                    <span>System</span>
                  </SegmentedControl.ItemText>
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
                <SegmentedControl.Item value="light">
                  <SegmentedControl.ItemText class="flex items-center gap-2">
                    <SunIcon class="size-4" />
                    <span>Light</span>
                  </SegmentedControl.ItemText>
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
                <SegmentedControl.Item value="dark">
                  <SegmentedControl.ItemText class="flex items-center gap-2">
                    <MoonIcon class="size-4" />
                    <span>Dark</span>
                  </SegmentedControl.ItemText>
                  <SegmentedControl.ItemHiddenInput />
                </SegmentedControl.Item>
              </SegmentedControl.Control>
            </SegmentedControl>
          </div>

          <div class="grid grid-cols-1 gap-2 lg:grid-cols-3">
            {#each themes as theme (theme.name)}
              <button
                type="button"
                data-theme={theme.name}
                class={`grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-md border border-surface-200-800 bg-surface-50-950 p-3 text-start hover:preset-outlined-surface-950-50 ${
                  appStore.theme.value === theme.name ? 'preset-outlined-surface-500' : ''
                }`}
                onclick={() => (appStore.theme.value = theme.name)}
              >
                <span>{theme.emoji}</span>
                <h3 class="text-sm font-bold capitalize">{theme.name}</h3>
                <div class="flex items-center justify-center -space-x-1.5">
                  <div
                    class="aspect-square w-4 rounded-full border border-black/10 bg-primary-500"
                  ></div>
                  <div
                    class="aspect-square w-4 rounded-full border border-black/10 bg-secondary-500"
                  ></div>
                  <div
                    class="aspect-square w-4 rounded-full border border-black/10 bg-tertiary-500"
                  ></div>
                </div>
              </button>
            {/each}
          </div>

          <div class="mx-auto flex justify-center card bg-primary-500 py-4">
            <a
              href="https://themes.skeleton.dev/"
              target="_blank"
              rel="noreferrer"
              class="btn preset-filled"
            >
              <span>Create a Theme</span>
              <ArrowUpRightIcon class="size-4" />
            </a>
          </div>
        </div>
      </Popover.Content>
    </Popover.Positioner>
  </Portal>
</Popover>
