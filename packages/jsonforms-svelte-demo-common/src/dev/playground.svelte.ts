import { tick } from 'svelte';
import type { ExampleDescription } from './examples';

type JsonFormsElement = HTMLElement & {
  schema?: string;
  uischema?: string;
  uischemas?: string;
  data?: string;
  config?: string;
  translations?: string;
  mode?: string | boolean;
  theme?: string;
};

function exampleAttributes(example: ExampleDescription) {
  return Object.fromEntries(
    ['schema', 'uischema', 'uischemas', 'data', 'config', 'translations'].map((key) => [
      key,
      JSON.stringify(exampleAttribute(example, key)),
    ]),
  );
}
function exampleAttribute(example: ExampleDescription, key: string) {
  const sourceKey = key === 'translations' ? 'i18n' : key;
  const value = example.input[sourceKey as keyof typeof example.input];
  return value ?? defaultAttribute(key);
}
function defaultAttribute(key: string) {
  return key === 'uischemas' ? [] : {};
}

export function usePlayground(examples: ExampleDescription[], defaultTheme?: string) {
  let selectedExampleName = $state(examples[0]?.name ?? '');
  let mode = $state<'light' | 'dark' | 'system'>('system');
  let selectedTheme = $state(defaultTheme);
  let loadedExampleText = $state('');
  let eventData = $state('No change events yet.');
  let eventErrors = $state('No validation errors yet.');
  let formEl = $state<JsonFormsElement | null>(null);

  const selectedExample = $derived.by(() =>
    examples.find((example) => example.name === selectedExampleName),
  );

  function currentExample() {
    return selectedExample ?? examples[0];
  }

  const applyExample = () => {
    const example = currentExample();
    if (!formEl) return;
    if (!example) return;

    Object.assign(formEl, exampleAttributes(example));
    formEl.mode = mode;
    if (selectedTheme !== undefined) formEl.theme = selectedTheme;

    loadedExampleText = `Loaded example: ${example.label}`;
  };

  const reloadExample = async () => {
    if (!formEl) return;
    formEl.data = undefined;
    await tick();
    applyExample();
  };

  const onChange = (event: Event) => {
    const detail = (event as CustomEvent).detail as {
      data?: unknown;
      errors?: unknown;
    };
    eventData = JSON.stringify(detail?.data ?? null, null, 2);
    eventErrors = JSON.stringify(detail?.errors ?? [], null, 2);
  };

  $effect(() => {
    void selectedExampleName;
    applyExample();
  });

  $effect(() => {
    if (!formEl) return;
    formEl.mode = mode;
    if (selectedTheme !== undefined) formEl.theme = selectedTheme;
  });
  return {
    reloadExample,
    onChange,
    get selectedExampleName() {
      return selectedExampleName;
    },
    set selectedExampleName(value: string) {
      selectedExampleName = value;
    },
    get mode() {
      return mode;
    },
    set mode(value: 'light' | 'dark' | 'system') {
      mode = value;
    },
    get selectedTheme() {
      return selectedTheme;
    },
    set selectedTheme(value: string | undefined) {
      selectedTheme = value;
    },
    get formEl() {
      return formEl;
    },
    set formEl(value: JsonFormsElement | null) {
      formEl = value;
    },
    get eventErrors() {
      return eventErrors;
    },
    get eventData() {
      return eventData;
    },
    get loadedExampleText() {
      return loadedExampleText;
    },
  };
}
