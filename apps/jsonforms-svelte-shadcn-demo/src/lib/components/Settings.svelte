<script lang="ts">
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { appstoreLayouts, useAppStore, type AppstoreLayouts } from '$lib/store/index.svelte';
  import {
    Badge,
    Button,
    Checkbox,
    Field,
    InputGroup,
    Select,
    Separator,
    Sheet,
    ToggleGroup,
  } from '$lib/components/ui';
  import {
    LaptopMinimalCheckIcon,
    MoonIcon,
    SunIcon,
    XIcon,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { tick } from 'svelte';

  const appStore = useAppStore();
  const translate = $derived(createDemoTranslator(appStore.jsonforms.locale.value));
  const validationModes = $derived([
    { name: translate('settings.validateShow'), value: 'ValidateAndShow' },
    { name: translate('settings.validateHide'), value: 'ValidateAndHide' },
    { name: translate('settings.noValidation'), value: 'NoValidation' },
  ]);
  const locales = $derived([
    { name: translate('settings.english'), value: 'en' },
    { name: translate('settings.german'), value: 'de' },
    { name: translate('settings.bulgarian'), value: 'bg' },
    {
      name: translate('settings.browserLanguage'),
      value: typeof navigator !== 'undefined' ? navigator.language : 'en',
    },
  ]);
  const layoutMapping: Record<AppstoreLayouts, string> = $derived({
    '': translate('settings.defaultLayout'),
    'demo-and-data': translate('settings.demoAndData'),
  });
  const layouts = $derived(
    appstoreLayouts.map((value) => ({ name: layoutMapping[value] ?? value, value })),
  );
  let keywordDraft = $state('');
  let keywordInput = $state<HTMLInputElement | null>(null);
  let settingsContent = $state<HTMLElement | null>(null);
  const errorKeywords = $derived(
    appStore.jsonforms.effectiveConfig.filterErrorKeywordsBeforeTouch ?? [],
  );

  const selectedLabel = (items: { name: string; value: string }[], value: string) =>
    items.find((item) => item.value === value)?.name ?? translate('settings.select');

  const parseKeywords = (value: string) =>
    value
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean);

  const addKeywords = (value = keywordDraft) => {
    const next = [...errorKeywords];
    for (const keyword of parseKeywords(value)) {
      if (!next.includes(keyword)) next.push(keyword);
    }
    appStore.jsonforms.config.filterErrorKeywordsBeforeTouch = next;
    keywordDraft = '';
  };

  const removeKeyword = (index: number) => {
    const scrollTop = settingsContent?.scrollTop;
    keywordInput?.focus({ preventScroll: true });
    appStore.jsonforms.config.filterErrorKeywordsBeforeTouch = errorKeywords.filter(
      (_, position) => position !== index,
    );

    if (scrollTop !== undefined) {
      void tick().then(() => {
        if (settingsContent) settingsContent.scrollTop = scrollTop;
      });
    }
  };

  const handleKeywordKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addKeywords();
      return;
    }

    if (event.key === 'Backspace' && !keywordDraft && errorKeywords.length > 0) {
      removeKeyword(errorKeywords.length - 1);
    }
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
  <Sheet.Content
    showCloseButton={false}
    bind:ref={settingsContent}
    side="right"
    class="w-full overflow-y-auto sm:max-w-md"
  >
    <Sheet.Close>
      {#snippet child({ props })}
        <Button
          {...props}
          variant="ghost"
          size="icon-sm"
          class="absolute end-3 top-3"
          aria-label={translate('nav.closeSettings')}><XIcon /></Button
        >
      {/snippet}
    </Sheet.Close>
    <Sheet.Header>
      <Sheet.Title>{translate('settings.title')}</Sheet.Title>
      <Sheet.Description>{translate('settings.description')}</Sheet.Description>
    </Sheet.Header>

    <div class="space-y-6 px-4 pb-6">
      <Field.Field>
        <Field.Label>{translate('settings.mode')}</Field.Label>
        <ToggleGroup.Root
          type="single"
          variant="outline"
          value={appStore.mode.value}
          onValueChange={(value) =>
            value && (appStore.mode.value = value as typeof appStore.mode.value)}
          class="w-full"
        >
          <ToggleGroup.Item value="system" class="flex-1"
            ><LaptopMinimalCheckIcon />{translate('settings.system')}</ToggleGroup.Item
          >
          <ToggleGroup.Item value="light" class="flex-1"
            ><SunIcon />{translate('settings.light')}</ToggleGroup.Item
          >
          <ToggleGroup.Item value="dark" class="flex-1"
            ><MoonIcon />{translate('settings.dark')}</ToggleGroup.Item
          >
        </ToggleGroup.Root>
      </Field.Field>

      <Field.Field>
        <Field.Label>{translate('settings.direction')}</Field.Label>
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
        <Field.Label for="validation-mode">{translate('settings.validation')}</Field.Label>
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
        <Field.Label for="locale">{translate('settings.locale')}</Field.Label>
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
        <Field.Label for="layout">{translate('settings.layout')}</Field.Label>
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
          <Field.Legend>{translate('settings.options')}</Field.Legend>
          {@render option(
            translate('settings.hideRequired'),
            translate('settings.hideRequiredDescription'),
            !!appStore.jsonforms.effectiveConfig.hideRequiredAsterisk,
            (value) => (appStore.jsonforms.config.hideRequiredAsterisk = value),
          )}
          {@render option(
            translate('settings.showDescription'),
            translate('settings.showDescriptionDescription'),
            !!appStore.jsonforms.effectiveConfig.showUnfocusedDescription,
            (value) => (appStore.jsonforms.config.showUnfocusedDescription = value),
          )}
          {@render option(
            translate('settings.restrict'),
            translate('settings.restrictDescription'),
            !!appStore.jsonforms.effectiveConfig.restrict,
            (value) => (appStore.jsonforms.config.restrict = value),
          )}
          {@render option(
            translate('settings.readonly'),
            translate('settings.readonlyDescription'),
            !!appStore.jsonforms.readonly.value,
            (value) => (appStore.jsonforms.readonly.value = value),
          )}
          {@render option(
            translate('settings.collapseNew'),
            translate('settings.collapseNewDescription'),
            !!appStore.jsonforms.effectiveConfig.collapseNewItems,
            (value) => (appStore.jsonforms.config.collapseNewItems = value),
          )}
          {@render option(
            translate('settings.hideSummary'),
            translate('settings.hideSummaryDescription'),
            !!appStore.jsonforms.effectiveConfig.hideArraySummaryValidation,
            (value) => (appStore.jsonforms.config.hideArraySummaryValidation = value),
          )}
          {@render option(
            translate('settings.collapseInitially'),
            translate('settings.collapseInitiallyDescription'),
            !!appStore.jsonforms.effectiveConfig.initCollapsed,
            (value) => (appStore.jsonforms.config.initCollapsed = value),
          )}
          {@render option(
            translate('settings.hideAvatar'),
            translate('settings.hideAvatarDescription'),
            !!appStore.jsonforms.effectiveConfig.hideAvatar,
            (value) => (appStore.jsonforms.config.hideAvatar = value),
          )}
          {@render option(
            translate('settings.filterErrors'),
            translate('settings.filterErrorsDescription'),
            !!appStore.jsonforms.effectiveConfig.enableFilterErrorsBeforeTouch,
            (value) => (appStore.jsonforms.config.enableFilterErrorsBeforeTouch = value),
          )}

          <Field.Field>
            <Field.Label for="error-keywords">{translate('settings.keywords')}</Field.Label>
            <InputGroup.Root
              class="h-auto min-h-8 flex-wrap gap-1 px-1 py-0.5"
              onclick={(event) => {
                if (!(event.target as HTMLElement).closest('button, input')) {
                  keywordInput?.focus();
                }
              }}
            >
              {#if errorKeywords.length > 0}
                <InputGroup.Addon
                  class="max-w-full flex-wrap justify-start gap-1 p-0"
                  aria-label={translate('settings.filteredKeywords')}
                >
                  {#each errorKeywords as keyword, index (index)}
                    <Badge variant="secondary" class="h-6 shrink-0 gap-1 pe-0.5">
                      <span>{keyword}</span>
                      <InputGroup.Button
                        size="icon-xs"
                        class="size-4 rounded-full hover:bg-muted-foreground/15"
                        aria-label={translate('settings.removeKeyword', undefined, { keyword })}
                        onpointerdown={(event) => event.preventDefault()}
                        onclick={() => removeKeyword(index)}
                      >
                        <XIcon class="size-3" />
                      </InputGroup.Button>
                    </Badge>
                  {/each}
                </InputGroup.Addon>
              {/if}
              <InputGroup.Input
                bind:ref={keywordInput}
                id="error-keywords"
                class="h-7 min-w-32 basis-32 px-1"
                bind:value={keywordDraft}
                placeholder={translate('settings.addKeyword')}
                onkeydown={handleKeywordKeydown}
                onblur={() => keywordDraft.trim() && addKeywords()}
              />
            </InputGroup.Root>
            <Field.Description>{translate('settings.keywordsDescription')}</Field.Description>
          </Field.Field>

          {@render option(
            translate('settings.emptyNames'),
            translate('settings.emptyNamesDescription'),
            !!appStore.jsonforms.effectiveConfig.allowEmptyPropertyNames,
            (value) => (appStore.jsonforms.config.allowEmptyPropertyNames = value),
          )}

          {@render option(
            translate('settings.additional'),
            translate('settings.additionalDescription'),
            !!appStore.jsonforms.effectiveConfig.allowAdditionalPropertiesIfMissing,
            (value) => (appStore.jsonforms.config.allowAdditionalPropertiesIfMissing = value),
          )}
        </Field.Set>
      </Field.Group>
    </div>
  </Sheet.Content>
</Sheet.Root>
