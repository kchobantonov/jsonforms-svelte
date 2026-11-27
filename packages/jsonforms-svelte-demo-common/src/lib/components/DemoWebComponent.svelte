<script lang="ts">
  import type {
    JsonFormsChangeEvent,
    JsonFormsProps,
    JsonFormsValidityEvent,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import type { ActionEvent } from '@chobantonov/jsonforms-svelte-extended';
  import {
    loadDemoWebComponent,
    type DemoWebComponentProps,
    type DemoHostAttributes,
  } from './demoWebComponent';
  import { onMount, type Snippet } from 'svelte';

  let {
    renderElement,
    bundlePath,
    tag,
    ajv = undefined,
    data = undefined,
    schema = undefined,
    uischema = undefined,
    uischemas = undefined,
    config = undefined,
    external = undefined,
    readonly = false,
    validationMode = 'ValidateAndShow',
    locale = 'en',
    mode = 'system',
    theme,
    designSystem = undefined,
    translations = undefined,
    additionalErrors = undefined,
    externalSchemas = undefined,
    customStyle = '',
    onchange,
    onvaliditychange,
    onhandleaction,
  }: DemoWebComponentProps & {
    tag?: string;
    renderElement?: Snippet<[DemoHostAttributes, (node: HTMLElement) => { destroy(): void }]>;
    bundlePath: string;
  } = $props();

  let componentLoaded = $state(false);
  let element = $state<(HTMLElement & { ajv?: JsonFormsProps['ajv'] }) | null>(null);

  function isObjectAttribute(value: unknown) {
    return value !== null && typeof value === 'object';
  }

  function setHostAttribute(node: HTMLElement, key: string, value: unknown) {
    if (key in node || isObjectAttribute(value)) {
      Reflect.set(node, key, value);
      return;
    }
    if (value == null) node.removeAttribute(key);
    else node.setAttribute(key, String(value));
  }

  function connect(node: HTMLElement) {
    element = node;
    return {
      destroy() {
        element = null;
      },
    };
  }

  const stringifyJson = (value: unknown): string | undefined => {
    if (value === undefined) return undefined;
    return JSON.stringify(value);
  };

  const attributes = $derived<DemoHostAttributes>({
    schema: stringifyJson(schema),
    uischema,
    uischemas,
    data: stringifyJson(data),
    config: stringifyJson(config),
    ...(external === undefined ? {} : { external }),
    readonly,
    validationMode,
    locale,
    mode,
    ...(theme === undefined ? {} : { theme }),
    ...(designSystem === undefined ? {} : { designSystem: stringifyJson(designSystem) }),
    translations: stringifyJson(translations),
    additionalErrors: stringifyJson(additionalErrors),
    externalSchemas: stringifyJson(externalSchemas),
    customStyle,
  });

  onMount(async () => {
    await loadDemoWebComponent(bundlePath);
    componentLoaded = true;
  });

  // Assign host properties directly so that UI schemas retain callbacks and
  // custom-element setters receive their original case and value types.
  $effect(() => {
    const node = element;
    if (!node || !tag) return;
    let previous: Record<string, unknown> = {};
    $effect(() => {
      const next: Record<string, unknown> = attributes;
      for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
        const value = next[key];
        if (Object.hasOwn(previous, key) && Object.is(previous[key], value)) continue;
        setHostAttribute(node, key, value);
      }
      previous = next;
    });
  });

  $effect(() => {
    if (element) element.ajv = ajv;
  });

  $effect(() => {
    if (!element) return;
    const currentElement = element;

    const handleChange = (event: Event) => {
      if (!(event instanceof CustomEvent) || event.composedPath()[0] !== currentElement) return;
      const detail = (event as CustomEvent).detail as JsonFormsChangeEvent;
      onchange?.(detail);
    };
    const handleValidityChange = (event: Event) => {
      onvaliditychange?.((event as CustomEvent<JsonFormsValidityEvent>).detail);
    };
    const handleAction = (event: Event) => {
      const detail = (event as CustomEvent).detail as ActionEvent;
      (detail as ActionEvent & { hostActionCompletion?: Promise<void> }).hostActionCompletion =
        Promise.resolve(onhandleaction?.(detail));
    };

    currentElement.addEventListener('validity-change', handleValidityChange);
    currentElement.addEventListener('change', handleChange as EventListener);
    currentElement.addEventListener('handle-action', handleAction as EventListener);
    return () => {
      currentElement.removeEventListener('validity-change', handleValidityChange);
      currentElement.removeEventListener('change', handleChange as EventListener);
      currentElement.removeEventListener('handle-action', handleAction as EventListener);
    };
  });
</script>

{#if componentLoaded}
  {#if tag}
    <svelte:element this={tag} use:connect />
  {:else if renderElement}
    {@render renderElement(attributes, connect)}
  {/if}
{/if}
