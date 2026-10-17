<script lang="ts">
  import { createDemoTranslator } from '@chobantonov/jsonforms-svelte-demo-common';
  import { appstoreLayouts, useAppStore, type AppstoreLayouts } from '$lib/store/index.svelte';
  import {
    LaptopMinimalCheckIcon,
    MoonIcon as MoonSolid,
    SunIcon as SunSolid,
    XIcon,
  } from '@lucide/svelte';
  import { TagsInput } from '@skeletonlabs/skeleton-svelte';
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
  // Zag Svelte 1.34.1 keeps refs.log nonreactive, so TagsInput's native
  // announceLog watcher does not run. Use its public value callback until the
  // adapter is fixed; keep native editing, focus, validation and translated labels.
  let keywordAnnouncement = $state('');
  const updateKeywords = (value: string[]) => {
    const previous = appStore.jsonforms.effectiveConfig.filterErrorKeywordsBeforeTouch ?? [];
    if (value.length > previous.length) {
      const count = value.length - previous.length;
      keywordAnnouncement =
        count > 1
          ? translate('settings.keyword.pasted', undefined, { count })
          : translate('settings.keyword.added', undefined, { keyword: value.at(-1) });
    } else if (value.length < previous.length) {
      keywordAnnouncement =
        previous.length - value.length > 1
          ? translate('settings.keyword.input', undefined, { count: value.length })
          : translate('settings.keyword.deleted', undefined, {
              keyword: previous.find((keyword, index) => keyword !== value[index]),
            });
    } else {
      const index = value.findIndex((keyword, index) => keyword !== previous[index]);
      if (index >= 0)
        keywordAnnouncement = translate('settings.keyword.updated', undefined, {
          keyword: value[index],
        });
    }
    appStore.jsonforms.config.filterErrorKeywordsBeforeTouch = value;
  };
</script>

{#if appStore.settings}
  <button
    type="button"
    class="fixed inset-0 z-50 bg-surface-950/40"
    aria-label={translate('nav.closeSettings')}
    onclick={() => (appStore.settings = false)}
  ></button>
  <aside
    class="fixed end-0 top-0 z-50 h-screen w-full max-w-md overflow-y-auto border-s border-surface-200-800 bg-surface-50-950 p-6 shadow-2xl"
  >
    <div class="mb-4 flex items-center justify-between">
      <h5 class="text-base font-semibold">{translate('settings.title')}</h5>
      <button
        type="button"
        class="btn-icon preset-outlined"
        aria-label={translate('nav.closeSettings')}
        onclick={() => (appStore.settings = false)}
      >
        <XIcon class="size-4" />
      </button>
    </div>
    <hr class="my-4 hr" />

    <!-- Mode Section -->
    <div class="mb-6">
      <p class="mb-2 block text-sm font-medium">{translate('settings.mode')}</p>
      <div class="btn-group flex w-full preset-outlined-surface-200-800 p-1">
        <button
          type="button"
          class={`btn flex-1 ${appStore.mode.value === 'system' ? 'preset-filled' : ''}`}
          onclick={() => (appStore.mode.value = 'system')}
        >
          <LaptopMinimalCheckIcon class="me-2 h-4 w-4" />
          {translate('settings.system')}
        </button>
        <button
          type="button"
          class={`btn flex-1 ${appStore.mode.value === 'light' ? 'preset-filled' : ''}`}
          onclick={() => (appStore.mode.value = 'light')}
        >
          <SunSolid class="me-2 h-4 w-4" />
          {translate('settings.light')}
        </button>
        <button
          type="button"
          class={`btn flex-1 ${appStore.mode.value === 'dark' ? 'preset-filled' : ''}`}
          onclick={() => (appStore.mode.value = 'dark')}
        >
          <MoonSolid class="me-2 h-4 w-4" />
          {translate('settings.dark')}
        </button>
      </div>
    </div>

    <hr class="my-4 hr" />

    <!-- Direction Section -->
    <div class="mb-6">
      <p class="mb-2 block text-sm font-medium">{translate('settings.direction')}</p>
      <div class="btn-group flex w-full preset-outlined-surface-200-800 p-1">
        <button
          type="button"
          class={`btn flex-1 ${!appStore.rtl ? 'preset-filled' : ''}`}
          onclick={() => (appStore.rtl = false)}
        >
          LTR
        </button>
        <button
          type="button"
          class={`btn flex-1 ${appStore.rtl ? 'preset-filled' : ''}`}
          onclick={() => (appStore.rtl = true)}
        >
          RTL
        </button>
      </div>
    </div>

    <hr class="my-4 hr" />

    <!-- Validation Section -->
    <div class="mb-6">
      <label for="validation-mode" class="mb-2 block text-sm font-medium"
        >{translate('settings.validation')}</label
      >
      <select
        id="validation-mode"
        bind:value={appStore.jsonforms.validationMode}
        class="select w-full"
      >
        {#each validationModes as item (item.value)}
          <option value={item.value}>{item.name}</option>
        {/each}
      </select>
    </div>

    <hr class="my-4 hr" />

    <!-- Locale Section -->
    <div class="mb-6">
      <label for="locale" class="mb-2 block text-sm font-medium"
        >{translate('settings.locale')}</label
      >
      <select id="locale" bind:value={appStore.jsonforms.locale.value} class="select w-full">
        {#each locales as item (item.value)}
          <option value={item.value}>{item.name}</option>
        {/each}
      </select>
    </div>

    <hr class="my-4 hr" />

    <!-- Demo Layout Section -->
    <div class="mb-6">
      <label for="layout" class="mb-2 block text-sm font-medium"
        >{translate('settings.layout')}</label
      >
      <select id="layout" bind:value={appStore.layout.value} class="select w-full">
        {#each layouts as item (item.value)}
          <option value={item.value}>{item.name}</option>
        {/each}
      </select>
    </div>

    <hr class="my-4 hr" />

    <!-- Options Section -->
    <div class="mb-6">
      <h6 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">
        {translate('settings.options')}
      </h6>

      <div class="space-y-4">
        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={
                () => appStore.jsonforms.effectiveConfig.hideRequiredAsterisk,
                (value) => (appStore.jsonforms.config.hideRequiredAsterisk = value)
              }
            />
            <span>{translate('settings.hideRequired')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.hideRequiredDescription')}
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={
                () => appStore.jsonforms.effectiveConfig.showUnfocusedDescription,
                (value) => (appStore.jsonforms.config.showUnfocusedDescription = value)
              }
            />
            <span>{translate('settings.showDescription')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.showDescriptionDescription')}
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={
                () => appStore.jsonforms.effectiveConfig.restrict,
                (value) => (appStore.jsonforms.config.restrict = value)
              }
            />
            <span>{translate('settings.restrict')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.restrictDescription')}
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.readonly.value}
            />
            <span>{translate('settings.readonly')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.readonlyDescription')}
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={
                () => appStore.jsonforms.effectiveConfig.collapseNewItems,
                (value) => (appStore.jsonforms.config.collapseNewItems = value)
              }
            />
            <span>{translate('settings.collapseNew')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.collapseNewDescription')}
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={
                () => appStore.jsonforms.effectiveConfig.hideArraySummaryValidation,
                (value) => (appStore.jsonforms.config.hideArraySummaryValidation = value)
              }
            />
            <span>{translate('settings.hideSummary')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.hideSummaryDescription')}
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={
                () => appStore.jsonforms.effectiveConfig.initCollapsed,
                (value) => (appStore.jsonforms.config.initCollapsed = value)
              }
            />
            <span>{translate('settings.collapseInitially')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.collapseInitiallyDescription')}
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={
                () => appStore.jsonforms.effectiveConfig.hideAvatar,
                (value) => (appStore.jsonforms.config.hideAvatar = value)
              }
            />
            <span>{translate('settings.hideAvatar')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.hideAvatarDescription')}
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={
                () => appStore.jsonforms.effectiveConfig.enableFilterErrorsBeforeTouch,
                (value) => (appStore.jsonforms.config.enableFilterErrorsBeforeTouch = value)
              }
            />
            <span>{translate('settings.filterErrors')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.filterErrorsDescription')}
          </p>
        </div>

        <div>
          <p class="mb-2 block text-sm font-medium">{translate('settings.keywords')}</p>
          <TagsInput
            translations={{
              clearTriggerLabel: translate('settings.keyword.clear'),
              deleteTagTriggerLabel: (keyword) =>
                translate('settings.removeKeyword', undefined, { keyword }),
              tagAdded: (keyword) => translate('settings.keyword.added', undefined, { keyword }),
              tagDeleted: (keyword) =>
                translate('settings.keyword.deleted', undefined, { keyword }),
              tagUpdated: (keyword) =>
                translate('settings.keyword.updated', undefined, { keyword }),
              tagEdited: (keyword) => translate('settings.keyword.editing', undefined, { keyword }),
              tagSelected: (keyword) =>
                translate('settings.keyword.selected', undefined, { keyword }),
              tagsPasted: (values) =>
                translate('settings.keyword.pasted', undefined, { count: values.length }),
              noTagsSelected: translate('settings.keyword.noneSelected'),
              inputLabel: (count) => translate('settings.keyword.input', undefined, { count }),
            }}
            value={appStore.jsonforms.effectiveConfig.filterErrorKeywordsBeforeTouch ?? []}
            onValueChange={(details) => updateKeywords(details.value)}
          >
            <TagsInput.Control class="input min-h-12 w-full flex-wrap gap-2 p-2">
              <TagsInput.Context>
                {#snippet children(tagsInput)}
                  {#each tagsInput().value as value, index (index)}
                    <TagsInput.Item {value} {index}>
                      <TagsInput.ItemPreview class="badge preset-filled-primary-500">
                        <TagsInput.ItemText>{value}</TagsInput.ItemText>
                        <TagsInput.ItemDeleteTrigger
                          class="ms-1"
                          aria-label={translate('settings.removeKeyword', undefined, {
                            keyword: value,
                          })}
                        />
                      </TagsInput.ItemPreview>
                      <TagsInput.ItemInput />
                    </TagsInput.Item>
                  {/each}
                {/snippet}
              </TagsInput.Context>
              <TagsInput.Input
                aria-label={translate('settings.keywords')}
                placeholder={translate('settings.keywordPlaceholder')}
                class="min-w-32 flex-1 bg-transparent outline-none"
              />
            </TagsInput.Control>
          </TagsInput>
          <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {keywordAnnouncement}
          </div>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.keywordsHelp')}
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={
                () => appStore.jsonforms.effectiveConfig.allowEmptyPropertyNames,
                (value) => (appStore.jsonforms.config.allowEmptyPropertyNames = value)
              }
            />
            <span>{translate('settings.emptyNames')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.emptyNamesDescription')}
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={
                () => appStore.jsonforms.effectiveConfig.allowAdditionalPropertiesIfMissing,
                (value) => (appStore.jsonforms.config.allowAdditionalPropertiesIfMissing = value)
              }
            />
            <span>{translate('settings.additional')}</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            {translate('settings.additionalDescription')}
          </p>
        </div>
      </div>
    </div>
  </aside>
{/if}
