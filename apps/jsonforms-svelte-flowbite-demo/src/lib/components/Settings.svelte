<script lang="ts">
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { appstoreLayouts, useAppStore, type AppstoreLayouts } from '$lib/store/index.svelte';
  import {
    Button,
    ButtonGroup,
    CloseButton,
    Drawer,
    Heading,
    Hr,
    Label,
    Select,
    Badge,
    Input,
    Toggle,
    Tooltip,
  } from 'flowbite-svelte';
  import { MoonSolid, SunSolid } from 'flowbite-svelte-icons';

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
    appstoreLayouts.map((value: AppstoreLayouts) => ({
      name: layoutMapping[value] ?? value,
      value: value,
    })),
  );
  let keywordDraft = $state('');
  let keywordInput = $state<HTMLInputElement>();
  const errorKeywords = $derived(
    appStore.jsonforms.effectiveConfig.filterErrorKeywordsBeforeTouch ?? [],
  );
  const addKeywords = () => {
    const next = [...errorKeywords];
    for (const keyword of keywordDraft
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)) {
      if (!next.includes(keyword)) next.push(keyword);
    }
    appStore.jsonforms.config.filterErrorKeywordsBeforeTouch = next;
    keywordDraft = '';
  };
  const removeKeyword = (index: number) => {
    keywordInput?.focus({ preventScroll: true });
    appStore.jsonforms.config.filterErrorKeywordsBeforeTouch = errorKeywords.filter(
      (_, position) => position !== index,
    );
  };
</script>

<Drawer bind:open={appStore.settings} placement="right" dismissable={false}>
  <div class="mb-4 flex items-center justify-between">
    <Heading tag="h5" class="text-base font-semibold">{translate('settings.title')}</Heading>
    <CloseButton
      name={translate('nav.closeSettings')}
      onclick={() => (appStore.settings = false)}
    />
  </div>
  <Hr class="my-4" />

  <!-- Theme Section -->
  <div class="mb-6">
    <Label class="mb-2 block">{translate('settings.theme')}</Label>
    <ButtonGroup class="w-full">
      <Button
        color={appStore.mode.value === 'light' ? 'primary' : 'alternative'}
        class="flex-1"
        onclick={() => (appStore.mode.value = 'light')}
      >
        <SunSolid class="me-2 h-4 w-4" />
        {translate('settings.light')}
      </Button>
      <Button
        color={appStore.mode.value === 'system' ? 'primary' : 'alternative'}
        class="flex-1"
        onclick={() => (appStore.mode.value = 'system')}
      >
        {translate('settings.system')}
      </Button>
      <Button
        color={appStore.mode.value === 'dark' ? 'primary' : 'alternative'}
        class="flex-1"
        onclick={() => (appStore.mode.value = 'dark')}
      >
        <MoonSolid class="me-2 h-4 w-4" />
        {translate('settings.dark')}
      </Button>
    </ButtonGroup>
  </div>

  <Hr class="my-4" />

  <!-- Direction Section -->
  <div class="mb-6">
    <Label class="mb-2 block">{translate('settings.direction')}</Label>
    <ButtonGroup class="w-full">
      <Button
        color={!appStore.rtl ? 'primary' : 'alternative'}
        class="flex-1"
        onclick={() => (appStore.rtl = false)}
      >
        LTR
      </Button>
      <Button
        color={appStore.rtl ? 'primary' : 'alternative'}
        class="flex-1"
        onclick={() => (appStore.rtl = true)}
      >
        RTL
      </Button>
    </ButtonGroup>
  </div>

  <Hr class="my-4" />

  <!-- Validation Section -->
  <div class="mb-6">
    <Label for="validation-mode" class="mb-2 block">{translate('settings.validation')}</Label>
    <Select
      id="validation-mode"
      items={validationModes}
      bind:value={appStore.jsonforms.validationMode}
    />
  </div>

  <Hr class="my-4" />

  <!-- Locale Section -->
  <div class="mb-6">
    <Label for="locale" class="mb-2 block">{translate('settings.locale')}</Label>
    <Select id="locale" items={locales} bind:value={appStore.jsonforms.locale.value} />
  </div>

  <Hr class="my-4" />

  <!-- Demo Layout Section -->
  <div class="mb-6">
    <Label for="layout" class="mb-2 block">{translate('settings.layout')}</Label>
    <Select id="layout" items={layouts} bind:value={appStore.layout.value} />
  </div>

  <Hr class="my-4" />

  <!-- Options Section -->
  <div class="mb-6">
    <h6 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
      {translate('settings.options')}
    </h6>

    <div class="space-y-4">
      <div>
        <Toggle
          bind:checked={
            () => appStore.jsonforms.effectiveConfig.hideRequiredAsterisk,
            (value) => (appStore.jsonforms.config.hideRequiredAsterisk = value)
          }
        >
          {translate('settings.hideRequired')}
        </Toggle>
        <Tooltip>{translate('settings.hideRequiredDescription')}</Tooltip>
      </div>

      <div>
        <Toggle
          bind:checked={
            () => appStore.jsonforms.effectiveConfig.showUnfocusedDescription,
            (value) => (appStore.jsonforms.config.showUnfocusedDescription = value)
          }
        >
          {translate('settings.showDescription')}
        </Toggle>
        <Tooltip>{translate('settings.showDescriptionDescription')}</Tooltip>
      </div>

      <div>
        <Toggle
          bind:checked={
            () => appStore.jsonforms.effectiveConfig.restrict,
            (value) => (appStore.jsonforms.config.restrict = value)
          }>{translate('settings.restrict')}</Toggle
        >
        <Tooltip>
          {translate('settings.restrictDescription')}
        </Tooltip>
      </div>

      <div>
        <Toggle bind:checked={appStore.jsonforms.readonly.value}
          >{translate('settings.readonly')}</Toggle
        >
        <Tooltip>{translate('settings.readonlyDescription')}</Tooltip>
      </div>

      <div>
        <Toggle
          bind:checked={
            () => appStore.jsonforms.effectiveConfig.collapseNewItems,
            (value) => (appStore.jsonforms.config.collapseNewItems = value)
          }
        >
          {translate('settings.collapseNew')}
        </Toggle>
        <Tooltip>{translate('settings.collapseNewDescription')}</Tooltip>
      </div>

      <div>
        <Toggle
          bind:checked={
            () => appStore.jsonforms.effectiveConfig.hideArraySummaryValidation,
            (value) => (appStore.jsonforms.config.hideArraySummaryValidation = value)
          }
        >
          {translate('settings.hideSummary')}
        </Toggle>
        <Tooltip>{translate('settings.hideSummaryDescription')}</Tooltip>
      </div>

      <div>
        <Toggle
          bind:checked={
            () => appStore.jsonforms.effectiveConfig.initCollapsed,
            (value) => (appStore.jsonforms.config.initCollapsed = value)
          }
        >
          {translate('settings.collapseInitially')}
        </Toggle>
        <Tooltip>{translate('settings.collapseInitiallyDescription')}</Tooltip>
      </div>

      <div>
        <Toggle
          bind:checked={
            () => appStore.jsonforms.effectiveConfig.hideAvatar,
            (value) => (appStore.jsonforms.config.hideAvatar = value)
          }>{translate('settings.hideAvatar')}</Toggle
        >
        <Tooltip>{translate('settings.hideAvatarDescription')}</Tooltip>
      </div>

      <div>
        <Toggle
          bind:checked={
            () => appStore.jsonforms.effectiveConfig.enableFilterErrorsBeforeTouch,
            (value) => (appStore.jsonforms.config.enableFilterErrorsBeforeTouch = value)
          }
        >
          {translate('settings.filterErrors')}
        </Toggle>
        <Tooltip>{translate('settings.filterErrorsDescription')}</Tooltip>
      </div>

      <div>
        <Label for="error-keywords" class="mb-2 block">{translate('settings.keywords')}</Label>
        <div class="flex flex-wrap items-center gap-2">
          {#each errorKeywords as keyword, index (index)}
            <Badge color="gray" class="gap-1">
              {keyword}
              <CloseButton
                size="xs"
                name={translate('settings.removeKeyword', undefined, { keyword })}
                onclick={(event: MouseEvent) => {
                  event.preventDefault();
                  removeKeyword(index);
                }}
              />
            </Badge>
          {/each}
          <Input
            id="error-keywords"
            bind:elementRef={keywordInput}
            bind:value={keywordDraft}
            placeholder={translate('settings.addKeyword')}
            class="min-w-32 flex-1"
            onkeydown={(event) => {
              if (event.key === 'Enter' || event.key === ',') {
                event.preventDefault();
                addKeywords();
              } else if (event.key === 'Backspace' && !keywordDraft && errorKeywords.length) {
                event.preventDefault();
                const last = errorKeywords.at(-1)!;
                removeKeyword(errorKeywords.length - 1);
                keywordDraft = last;
              }
            }}
            onblur={() => keywordDraft.trim() && addKeywords()}
          />
        </div>
        <Tooltip>{translate('settings.keywordsHelp')}</Tooltip>
      </div>

      <div>
        <Toggle
          bind:checked={
            () => appStore.jsonforms.effectiveConfig.allowEmptyPropertyNames,
            (value) => (appStore.jsonforms.config.allowEmptyPropertyNames = value)
          }
        >
          {translate('settings.emptyNames')}
        </Toggle>
        <Tooltip>{translate('settings.emptyNamesDescription')}</Tooltip>
      </div>

      <div>
        <Toggle
          bind:checked={
            () => appStore.jsonforms.effectiveConfig.allowAdditionalPropertiesIfMissing,
            (value) => (appStore.jsonforms.config.allowAdditionalPropertiesIfMissing = value)
          }
        >
          {translate('settings.additional')}
        </Toggle>
        <Tooltip>
          {translate('settings.additionalDescription')}
        </Tooltip>
      </div>
    </div>
  </div>
</Drawer>
