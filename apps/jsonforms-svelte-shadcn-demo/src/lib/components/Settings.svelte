<script lang="ts">
  import { appstoreLayouts, useAppStore, type AppstoreLayouts } from '$lib/store/index.svelte';
  import {
    Checkbox,
    Field,
    Input,
    Select,
    Separator,
    Sheet,
    ToggleGroup,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { LaptopMinimalCheckIcon, MoonIcon, SunIcon } from '@lucide/svelte';

  const appStore = useAppStore();
  const validationModes = [
    { name: 'Validate And Show', value: 'ValidateAndShow' },
    { name: 'Validate And Hide', value: 'ValidateAndHide' },
    { name: 'No Validation', value: 'NoValidation' },
  ];
  const locales = [
    { name: 'English (en)', value: 'en' },
    { name: 'German (de)', value: 'de' },
    { name: 'Bulgarian (bg)', value: 'bg' },
    {
      name: 'Browser Language',
      value: typeof navigator !== 'undefined' ? navigator.language : 'en',
    },
  ];
  const layoutMapping: Record<AppstoreLayouts, string> = {
    '': 'Default',
    'demo-and-data': 'Demo and Data',
  };
  const layouts = appstoreLayouts.map((value) => ({ name: layoutMapping[value] ?? value, value }));

  const selectedLabel = (items: { name: string; value: string }[], value: string) =>
    items.find((item) => item.value === value)?.name ?? 'Select an option';

  const updateKeywords = (value: string) => {
    appStore.jsonforms.config.filterErrorKeywordsBeforeTouch = value
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);
  };
</script>

{#snippet option(
  label: string,
  description: string,
  checked: boolean,
  onchange: (value: boolean) => void,
)}
  <Field.Field orientation="horizontal">
    <Checkbox {checked} onCheckedChange={onchange} />
    <Field.Content>
      <Field.Label>{label}</Field.Label>
      <Field.Description>{description}</Field.Description>
    </Field.Content>
  </Field.Field>
{/snippet}

<Sheet.Root open={appStore.settings} onOpenChange={(open) => (appStore.settings = open)}>
  <Sheet.Content side="right" class="w-full overflow-y-auto sm:max-w-md">
    <Sheet.Header>
      <Sheet.Title>Settings</Sheet.Title>
      <Sheet.Description>Configure the renderer demo and JSON Forms behavior.</Sheet.Description>
    </Sheet.Header>

    <div class="space-y-6 px-4 pb-6">
      <Field.Field>
        <Field.Label>Mode</Field.Label>
        <ToggleGroup.Root
          type="single"
          variant="outline"
          value={appStore.mode.value}
          onValueChange={(value) =>
            value && (appStore.mode.value = value as typeof appStore.mode.value)}
          class="w-full"
        >
          <ToggleGroup.Item value="system" class="flex-1"
            ><LaptopMinimalCheckIcon />System</ToggleGroup.Item
          >
          <ToggleGroup.Item value="light" class="flex-1"><SunIcon />Light</ToggleGroup.Item>
          <ToggleGroup.Item value="dark" class="flex-1"><MoonIcon />Dark</ToggleGroup.Item>
        </ToggleGroup.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label>Direction</Field.Label>
        <ToggleGroup.Root
          type="single"
          variant="outline"
          value={appStore.rtl ? 'rtl' : 'ltr'}
          onValueChange={(value) => value && (appStore.rtl = value === 'rtl')}
          class="w-full"
        >
          <ToggleGroup.Item value="ltr" class="flex-1">LTR</ToggleGroup.Item>
          <ToggleGroup.Item value="rtl" class="flex-1">RTL</ToggleGroup.Item>
        </ToggleGroup.Root>
      </Field.Field>

      <Separator />

      <Field.Field>
        <Field.Label for="validation-mode">Validation</Field.Label>
        <Select.Root
          type="single"
          value={appStore.jsonforms.validationMode}
          onValueChange={(value) =>
            (appStore.jsonforms.validationMode = value as typeof appStore.jsonforms.validationMode)}
        >
          <Select.Trigger id="validation-mode" class="w-full"
            >{selectedLabel(validationModes, appStore.jsonforms.validationMode)}</Select.Trigger
          >
          <Select.Content>
            {#each validationModes as item (item.value)}<Select.Item
                value={item.value}
                label={item.name}>{item.name}</Select.Item
              >{/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label for="locale">Locale</Field.Label>
        <Select.Root
          type="single"
          value={appStore.jsonforms.locale.value}
          onValueChange={(value) => (appStore.jsonforms.locale.value = value)}
        >
          <Select.Trigger id="locale" class="w-full"
            >{selectedLabel(locales, appStore.jsonforms.locale.value)}</Select.Trigger
          >
          <Select.Content>
            {#each locales as item (item.value)}<Select.Item value={item.value} label={item.name}
                >{item.name}</Select.Item
              >{/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label for="layout">Demo Layout</Field.Label>
        <Select.Root
          type="single"
          value={appStore.layout.value}
          onValueChange={(value) => (appStore.layout.value = value as AppstoreLayouts)}
        >
          <Select.Trigger id="layout" class="w-full"
            >{selectedLabel(layouts, appStore.layout.value)}</Select.Trigger
          >
          <Select.Content>
            {#each layouts as item (item.value)}<Select.Item value={item.value} label={item.name}
                >{item.name}</Select.Item
              >{/each}
          </Select.Content>
        </Select.Root>
      </Field.Field>

      <Separator />

      <Field.Group>
        <Field.Set>
          <Field.Legend>Options</Field.Legend>
          {@render option(
            'Hide Required Asterisk',
            'Hide asterisks in labels for required fields.',
            !!appStore.jsonforms.config.hideRequiredAsterisk,
            (value) => (appStore.jsonforms.config.hideRequiredAsterisk = value),
          )}
          {@render option(
            'Show Unfocused Description',
            'Keep input descriptions visible while controls are unfocused.',
            !!appStore.jsonforms.config.showUnfocusedDescription,
            (value) => (appStore.jsonforms.config.showUnfocusedDescription = value),
          )}
          {@render option(
            'Restrict',
            'Enforce maxLength and array size restrictions from the schema.',
            !!appStore.jsonforms.config.restrict,
            (value) => (appStore.jsonforms.config.restrict = value),
          )}
          {@render option(
            'Read-Only',
            'Set all controls to read-only.',
            !!appStore.jsonforms.readonly.value,
            (value) => (appStore.jsonforms.readonly.value = value),
          )}
          {@render option(
            'Collapse new array items',
            'Do not expand newly added array items.',
            !!appStore.jsonforms.config.collapseNewItems,
            (value) => (appStore.jsonforms.config.collapseNewItems = value),
          )}
          {@render option(
            'Hide array summary validation',
            'Hide validation summaries in array headers.',
            !!appStore.jsonforms.config.hideArraySummaryValidation,
            (value) => (appStore.jsonforms.config.hideArraySummaryValidation = value),
          )}
          {@render option(
            'Collapse arrays initially',
            'Start array accordions collapsed.',
            !!appStore.jsonforms.config.initCollapsed,
            (value) => (appStore.jsonforms.config.initCollapsed = value),
          )}
          {@render option(
            'Hide Array Item Avatar',
            'Hide array index avatars.',
            !!appStore.jsonforms.config.hideAvatar,
            (value) => (appStore.jsonforms.config.hideAvatar = value),
          )}
          {@render option(
            'Enable Filter Errors Before Touch',
            'Hide selected validation errors until a control is touched.',
            !!appStore.jsonforms.config.enableFilterErrorsBeforeTouch,
            (value) => (appStore.jsonforms.config.enableFilterErrorsBeforeTouch = value),
          )}

          <Field.Field>
            <Field.Label for="error-keywords">Filter Error Keywords Before Touch</Field.Label>
            <Input
              id="error-keywords"
              value={(appStore.jsonforms.config.filterErrorKeywordsBeforeTouch ?? []).join(', ')}
              placeholder="e.g. required, minLength, pattern"
              oninput={(event) => updateKeywords(event.currentTarget.value)}
            />
            <Field.Description
              >Comma-separated AJV keywords hidden until the control is touched.</Field.Description
            >
          </Field.Field>

          {@render option(
            'Allow Additional Properties By Default',
            'Allow additional properties when the schema does not explicitly configure them.',
            !!appStore.jsonforms.config.allowAdditionalPropertiesIfMissing,
            (value) => (appStore.jsonforms.config.allowAdditionalPropertiesIfMissing = value),
          )}
        </Field.Set>
      </Field.Group>
    </div>
  </Sheet.Content>
</Sheet.Root>
