<script lang="ts">
  import { appstoreLayouts, useAppStore, type AppstoreLayouts } from '$lib/store/index.svelte';
  import {
    LaptopMinimalCheckIcon,
    MoonIcon as MoonSolid,
    SunIcon as SunSolid,
    XIcon,
  } from '@lucide/svelte';
  import { TagsInput } from '@skeletonlabs/skeleton-svelte';
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

  const layouts = appstoreLayouts.map((value: AppstoreLayouts) => ({
    name: layoutMapping[value] ?? value,
    value: value,
  }));
</script>

{#if appStore.settings}
  <button
    type="button"
    class="fixed inset-0 z-50 bg-surface-950/40"
    aria-label="Close settings"
    onclick={() => (appStore.settings = false)}
  ></button>
  <aside
    class="fixed top-0 end-0 z-50 h-screen w-full max-w-md overflow-y-auto border-s border-surface-200-800 bg-surface-50-950 p-6 shadow-2xl"
  >
    <div class="mb-4 flex items-center justify-between">
      <h5 class="text-base font-semibold">Settings</h5>
      <button
        type="button"
        class="btn-icon preset-outlined"
        onclick={() => (appStore.settings = false)}
      >
        <XIcon class="size-4" />
      </button>
    </div>
    <hr class="my-4 hr" />

    <!-- Mode Section -->
    <div class="mb-6">
      <p class="mb-2 block text-sm font-medium">Mode</p>
      <div class="btn-group flex w-full preset-outlined-surface-200-800 p-1">
        <button
          type="button"
          class={`btn flex-1 ${appStore.mode.value === 'system' ? 'preset-filled' : ''}`}
          onclick={() => (appStore.mode.value = 'system')}
        >
          <LaptopMinimalCheckIcon class="me-2 h-4 w-4" />
          SYSTEM
        </button>
        <button
          type="button"
          class={`btn flex-1 ${appStore.mode.value === 'light' ? 'preset-filled' : ''}`}
          onclick={() => (appStore.mode.value = 'light')}
        >
          <SunSolid class="me-2 h-4 w-4" />
          LIGHT
        </button>
        <button
          type="button"
          class={`btn flex-1 ${appStore.mode.value === 'dark' ? 'preset-filled' : ''}`}
          onclick={() => (appStore.mode.value = 'dark')}
        >
          <MoonSolid class="me-2 h-4 w-4" />
          DARK
        </button>
      </div>
    </div>

    <hr class="my-4 hr" />

    <!-- Direction Section -->
    <div class="mb-6">
      <p class="mb-2 block text-sm font-medium">Direction</p>
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
      <label for="validation-mode" class="mb-2 block text-sm font-medium">Validation</label>
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
      <label for="locale" class="mb-2 block text-sm font-medium">Locale</label>
      <select id="locale" bind:value={appStore.jsonforms.locale.value} class="select w-full">
        {#each locales as item (item.value)}
          <option value={item.value}>{item.name}</option>
        {/each}
      </select>
    </div>

    <hr class="my-4 hr" />

    <!-- Demo Layout Section -->
    <div class="mb-6">
      <label for="layout" class="mb-2 block text-sm font-medium">Demo Layout</label>
      <select id="layout" bind:value={appStore.layout.value} class="select w-full">
        {#each layouts as item (item.value)}
          <option value={item.value}>{item.name}</option>
        {/each}
      </select>
    </div>

    <hr class="my-4 hr" />

    <!-- Options Section -->
    <div class="mb-6">
      <h6 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">Options</h6>

      <div class="space-y-4">
        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.config.hideRequiredAsterisk}
            />
            <span>Hide Required Asterisk</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            If asterisks in labels for required fields should be hidden
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.config.showUnfocusedDescription}
            />
            <span>Show Unfocused Description</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            If input descriptions should hide when not focused
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.config.restrict}
            />
            <span>Restrict</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            Whether to restrict the number of characters to maxLength, if specified in the JSON
            schema
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.readonly.value}
            />
            <span>Read-Only</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">If true, sets all controls to read-only</p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.config.collapseNewItems}
            />
            <span>Collapse new array items</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            If true, new array items are not expanded by default
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.config.hideArraySummaryValidation}
            />
            <span>Hide array summary validation</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            If true, the summary of validation errors in arrays is hidden
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.config.initCollapsed}
            />
            <span>Collapse arrays initially</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            If true, arrays are not expanded initially
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.config.hideAvatar}
            />
            <span>Hide Array Item Avatar</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            Whether the array index avatars shall be shown
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.config.enableFilterErrorsBeforeTouch}
            />
            <span>Enable Filter Errors Before Touch</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            Whether the errors will be displayed for not touched controls
          </p>
        </div>

        <div>
          <p class="mb-2 block text-sm font-medium">Filter Error Keywords Before Touch</p>
          <TagsInput
            value={appStore.jsonforms.config.filterErrorKeywordsBeforeTouch ?? []}
            onValueChange={(details) =>
              (appStore.jsonforms.config.filterErrorKeywordsBeforeTouch = details.value)}
          >
            <TagsInput.Control class="input min-h-12 w-full flex-wrap gap-2 p-2">
              <TagsInput.Context>
                {#snippet children(tagsInput)}
                  {#each tagsInput().value as value, index (index)}
                    <TagsInput.Item {value} {index}>
                      <TagsInput.ItemPreview class="badge preset-filled-primary-500">
                        <TagsInput.ItemText>{value}</TagsInput.ItemText>
                        <TagsInput.ItemDeleteTrigger class="ms-1" />
                      </TagsInput.ItemPreview>
                      <TagsInput.ItemInput />
                    </TagsInput.Item>
                  {/each}
                {/snippet}
              </TagsInput.Context>
              <TagsInput.Input
                placeholder="e.g., required, minLength, pattern"
                class="min-w-32 flex-1 bg-transparent outline-none"
              />
            </TagsInput.Control>
          </TagsInput>
          <p class="text-surface-500-700 mt-1 text-sm">
            Hide specific AJV error keywords until the control is touched. Requires "Enable Filter
            Errors Before Touch".
          </p>
        </div>

        <div>
          <label class="flex items-center gap-3">
            <input
              class="checkbox"
              type="checkbox"
              bind:checked={appStore.jsonforms.config.allowAdditionalPropertiesIfMissing}
            />
            <span>Allow Additional Properties By Default</span>
          </label>
          <p class="text-surface-500-700 mt-1 text-sm">
            Allow adding additional properties when the schema does not specify explicitly the
            additionalProperties
          </p>
        </div>
      </div>
    </div>
  </aside>
{/if}
