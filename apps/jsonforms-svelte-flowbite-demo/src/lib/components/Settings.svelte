<script lang="ts">
  import { appstoreLayouts, useAppStore, type AppstoreLayouts } from '$lib/store/index.svelte';
  import {
    Button,
    ButtonGroup,
    Drawer,
    Heading,
    Hr,
    Label,
    Select,
    Tags,
    Toggle,
    Tooltip,
  } from 'flowbite-svelte';
  import { MoonSolid, SunSolid } from 'flowbite-svelte-icons';

  interface Props {
    open: boolean;
  }
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

<Drawer bind:open={appStore.settings} placement="right">
  <div class="mb-4 flex items-center justify-between">
    <Heading tag="h5" class="text-base font-semibold">Settings</Heading>
  </div>
  <Hr class="my-4" />

  <!-- Theme Section -->
  <div class="mb-6">
    <Label class="mb-2 block">Theme</Label>
    <ButtonGroup class="w-full">
      <Button
        color={!appStore.dark.value ? 'primary' : 'alternative'}
        class="flex-1"
        onclick={() => (appStore.dark.value = false)}
      >
        <SunSolid class="me-2 h-4 w-4" />
        LIGHT
      </Button>
      <Button
        color={appStore.dark.value ? 'primary' : 'alternative'}
        class="flex-1"
        onclick={() => (appStore.dark.value = true)}
      >
        <MoonSolid class="me-2 h-4 w-4" />
        DARK
      </Button>
    </ButtonGroup>
  </div>

  <Hr class="my-4" />

  <!-- Direction Section -->
  <div class="mb-6">
    <Label class="mb-2 block">Direction</Label>
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
    <Label for="validation-mode" class="mb-2 block">Validation</Label>
    <Select
      id="validation-mode"
      items={validationModes}
      bind:value={appStore.jsonforms.validationMode}
    />
  </div>

  <Hr class="my-4" />

  <!-- Locale Section -->
  <div class="mb-6">
    <Label for="locale" class="mb-2 block">Locale</Label>
    <Select id="locale" items={locales} bind:value={appStore.jsonforms.locale.value} />
  </div>

  <Hr class="my-4" />

  <!-- Demo Layout Section -->
  <div class="mb-6">
    <Label for="layout" class="mb-2 block">Demo Layout</Label>
    <Select id="layout" items={layouts} bind:value={appStore.layout.value} />
  </div>

  <Hr class="my-4" />

  <!-- Options Section -->
  <div class="mb-6">
    <h6 class="mb-3 text-sm font-medium text-gray-900 dark:text-white">Options</h6>

    <div class="space-y-4">
      <div>
        <Toggle bind:checked={appStore.jsonforms.config.hideRequiredAsterisk}>
          Hide Required Asterisk
        </Toggle>
        <Tooltip>If asterisks in labels for required fields should be hidden</Tooltip>
      </div>

      <div>
        <Toggle bind:checked={appStore.jsonforms.config.showUnfocusedDescription}>
          Show Unfocused Description
        </Toggle>
        <Tooltip>If input descriptions should hide when not focused</Tooltip>
      </div>

      <div>
        <Toggle bind:checked={appStore.jsonforms.config.restrict}>Restrict</Toggle>
        <Tooltip>
          Whether to restrict the number of characters to maxLength, if specified in the JSON schema
        </Tooltip>
      </div>

      <div>
        <Toggle bind:checked={appStore.jsonforms.readonly.value}>Read-Only</Toggle>
        <Tooltip>If true, sets all controls to read-only</Tooltip>
      </div>

      <div>
        <Toggle bind:checked={appStore.jsonforms.config.collapseNewItems}>
          Collapse new array items
        </Toggle>
        <Tooltip>If true, new array items are not expanded by default</Tooltip>
      </div>

      <div>
        <Toggle bind:checked={appStore.jsonforms.config.hideArraySummaryValidation}>
          Hide array summary validation
        </Toggle>
        <Tooltip>If true, the summary of validation errors in arrays is hidden</Tooltip>
      </div>

      <div>
        <Toggle bind:checked={appStore.jsonforms.config.initCollapsed}>
          Collapse arrays initially
        </Toggle>
        <Tooltip>If true, arrays are not expanded initially</Tooltip>
      </div>

      <div>
        <Toggle bind:checked={appStore.jsonforms.config.hideAvatar}>Hide Array Item Avatar</Toggle>
        <Tooltip>Whether the array index avatars shall be shown</Tooltip>
      </div>

      <div>
        <Toggle bind:checked={appStore.jsonforms.config.enableFilterErrorsBeforeTouch}>
          Enable Filter Errors Before Touch
        </Toggle>
        <Tooltip>Whether the errors will be displayed for not touched controls</Tooltip>
      </div>

      <div>
        <Tags
          bind:value={appStore.jsonforms.config.filterErrorKeywordsBeforeTouch}
          unique={true}
          placeholder="e.g., required, minLength, pattern"
        >
          Filter Error Keywords Before Touch
        </Tags>
        <Tooltip
          >Hide specific AJV error keywords until the control is touched. Requires "Enable Filter
          Errors Before Touch".</Tooltip
        >
      </div>

      <div>
        <Toggle bind:checked={appStore.jsonforms.config.allowAdditionalPropertiesIfMissing}>
          Allow Additional Properties By Default
        </Toggle>
        <Tooltip>
          Allow adding additional properties when the schema does not specify explicitly the
          additionalProperties
        </Tooltip>
      </div>
    </div>
  </div>
</Drawer>
