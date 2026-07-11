<script lang="ts">
  import { useAppStore } from '$lib/store/index.svelte';
  import {
    Dice5Icon,
    LaptopMinimalCheckIcon,
    MoonIcon,
    PaletteIcon,
    RotateCcwIcon,
    SunIcon,
  } from '@lucide/svelte';
  import {
    Button,
    Popover,
    Select,
    Separator,
    ToggleGroup,
    buttonVariants,
    defaultShadcnDesignSystem,
    designSystemBaseColors,
    designSystemFonts,
    designSystemIconLibraries,
    designSystemMenuAccents,
    designSystemMenuColors,
    designSystemRadii,
    designSystemStyles,
    designSystemThemes,
    normalizeShadcnDesignSystem,
    randomizeShadcnDesignSystem,
    type ShadcnDesignSystemConfig,
  } from '@chobantonov/jsonforms-svelte-shadcn';

  type PickerKey =
    | 'style'
    | 'baseColor'
    | 'theme'
    | 'chartColor'
    | 'iconLibrary'
    | 'fontHeading'
    | 'font'
    | 'radius'
    | 'menuColor'
    | 'menuAccent';
  type PickerOption = { value: string; label: string; color?: string };

  const appStore = useAppStore();
  const triggerClass = buttonVariants({ variant: 'ghost', size: 'icon-lg' });
  const config = $derived(normalizeShadcnDesignSystem(appStore.designSystem.value));
  const headingFonts = [{ value: 'inherit', label: 'Inherit' }, ...designSystemFonts];

  const update = (key: PickerKey, value: string) => {
    const next = { ...config, [key]: value } as ShadcnDesignSystemConfig;
    if (key === 'baseColor' && config.theme === config.baseColor) {
      next.theme = value as ShadcnDesignSystemConfig['theme'];
    }
    if (key === 'menuColor' && value.includes('translucent')) {
      next.menuAccent = 'subtle';
    }
    appStore.designSystem.value = normalizeShadcnDesignSystem(next);
  };

  const selectedLabel = (options: readonly PickerOption[], value: string) =>
    options.find((option) => option.value === value)?.label ?? value;

  const reset = () => {
    appStore.designSystem.value = structuredClone(defaultShadcnDesignSystem);
  };
</script>

<Popover.Root>
  <Popover.Trigger class={triggerClass} aria-label="Customize theme" title="Customize theme">
    <PaletteIcon class="size-4" />
  </Popover.Trigger>
  <Popover.Content align="end" sideOffset={8} class="w-[min(92vw,18rem)] overflow-hidden p-0">
    <div class="max-h-[min(78vh,44rem)] overflow-y-auto p-1.5">
      {@render picker('Style', 'style', designSystemStyles)}
      {@render picker('Base Color', 'baseColor', designSystemBaseColors)}
      {@render picker('Theme', 'theme', designSystemThemes)}
      {@render picker('Chart Color', 'chartColor', designSystemThemes)}
      {@render picker('Icon Library', 'iconLibrary', designSystemIconLibraries)}
      {@render picker('Heading', 'fontHeading', headingFonts)}
      {@render picker('Font', 'font', designSystemFonts)}
      {@render picker('Radius', 'radius', designSystemRadii)}
      {@render picker('Menu', 'menuColor', designSystemMenuColors)}
      {@render picker('Menu Accent', 'menuAccent', designSystemMenuAccents)}

      <Separator class="my-1.5" />

      <Button
        variant="ghost"
        class="h-auto w-full justify-between px-2 py-2 text-start"
        onclick={() => (appStore.designSystem.value = randomizeShadcnDesignSystem())}
      >
        <span class="flex flex-col items-start">
          <span class="text-xs text-muted-foreground">Shuffle</span>
          <span class="text-sm font-medium">Try Random</span>
        </span>
        <Dice5Icon class="size-4" />
      </Button>
      <Button
        variant="ghost"
        class="h-auto w-full justify-between px-2 py-2 text-start"
        onclick={reset}
      >
        <span class="flex flex-col items-start">
          <span class="text-xs text-muted-foreground">Reset</span>
          <span class="text-sm font-medium">Start Over</span>
        </span>
        <RotateCcwIcon class="size-4" />
      </Button>

      <Separator class="my-1.5" />

      <div class="px-2 py-2">
        <div class="mb-2 text-xs text-muted-foreground">Mode</div>
        <ToggleGroup.Root
          type="single"
          variant="outline"
          value={appStore.mode.value}
          onValueChange={(value) => {
            if (value) appStore.mode.value = value as typeof appStore.mode.value;
          }}
          class="w-full"
        >
          <ToggleGroup.Item value="system" class="flex-1" aria-label="System mode">
            <LaptopMinimalCheckIcon class="size-4" />
          </ToggleGroup.Item>
          <ToggleGroup.Item value="light" class="flex-1" aria-label="Light mode">
            <SunIcon class="size-4" />
          </ToggleGroup.Item>
          <ToggleGroup.Item value="dark" class="flex-1" aria-label="Dark mode">
            <MoonIcon class="size-4" />
          </ToggleGroup.Item>
        </ToggleGroup.Root>
      </div>
    </div>
  </Popover.Content>
</Popover.Root>

{#snippet picker(label: string, key: PickerKey, options: readonly PickerOption[])}
  <div class="grid grid-cols-[minmax(0,1fr)_8.75rem] items-center gap-2 px-2 py-1">
    <div class="min-w-0">
      <div class="text-xs text-muted-foreground">{label}</div>
      <div class="truncate text-sm font-medium">{selectedLabel(options, String(config[key]))}</div>
    </div>
    <Select.Root
      type="single"
      value={String(config[key])}
      onValueChange={(value) => update(key, value)}
    >
      <Select.Trigger class="w-full" aria-label={label}>
        <span class="flex min-w-0 items-center gap-2 truncate">
          {#if options.find((option) => option.value === config[key])?.color}
            <span
              class="size-3 shrink-0 rounded-full"
              style={`background: hsl(${options.find((option) => option.value === config[key])?.color})`}
            ></span>
          {/if}
          <span class="truncate">{selectedLabel(options, String(config[key]))}</span>
        </span>
      </Select.Trigger>
      <Select.Content class="max-h-80">
        {#each options as option (option.value)}
          <Select.Item value={option.value} label={option.label}>
            {#if option.color}
              <span class="size-3 rounded-full" style={`background: hsl(${option.color})`}></span>
            {/if}
            {option.label}
          </Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
{/snippet}
