<script lang="ts">
  import { useDynamicTreeResolver } from '@chobantonov/jsonforms-svelte';
  const resolveTree = useDynamicTreeResolver();
  import { getAllContexts, mount, unmount, untrack, onDestroy, setContext } from 'svelte';
  import {
    useJsonForms,
    resolveUrlPolicy,
    useJsonFormsLayout,
    useRendererMessages,
    useTranslator,
    useUIDiagnosticReporter,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import {
    nativeTemplateSlotContext,
    type NativeTemplateSlotContext,
    type NativeTemplateLayout,
    type NativeTemplateProps,
    type NativeTemplateDescriptor,
    type NativeTemplateHandle,
    type NativeTemplateMountSlot,
  } from '../core/nativeTemplate';
  import { templateChildren } from '../core/templateChildren';
  import { useFormContext } from '../jsonFormsCompositions.svelte';
  import NativeTemplateSlot from './NativeTemplateSlot.svelte';
  const props: RendererProps = $props();
  const binding = useJsonFormsLayout(props as RendererProps<Layout>);
  const form = useJsonForms();
  const context = useFormContext();
  const translator = useTranslator();
  const message = useRendererMessages();
  const reportDiagnostic = useUIDiagnosticReporter();
  const layout = $derived(binding.layout);
  const template = $derived((layout.uischema as unknown as NativeTemplateLayout).template);
  const Template = $derived(typeof template === 'function' ? template : undefined);
  const descriptor = $derived(
    typeof template === 'object' ? (template as NativeTemplateDescriptor) : undefined,
  );
  let bridgeTarget = $state<HTMLElement | null>(null);
  let bridgeHandle = $state.raw<NativeTemplateHandle | undefined>();
  let bridgeError = $state(false);
  let reportedFailure = false;
  function reportNativeFailure() {
    if (reportedFailure) return;
    reportedFailure = true;
    reportDiagnostic('template.renderFailed', {
      severity: 'error',
      message: 'The native template could not be rendered.',
      path: layout.path,
      details: { kind: 'native' },
    });
  }
  $effect(() => {
    void template;
    void layout.path;
    reportedFailure = false;
  });
  const children = $derived(templateChildren(layout.uischema.elements ?? []));
  const effectiveChildren = $derived(
    children.elements.map((element) => ({
      ...resolveTree(element, layout.path),
      name: element.name,
    })),
  );
  const elements = $derived(
    Object.fromEntries(effectiveChildren.map((element) => [element.name, element])),
  );
  let reportedDuplicateChildren = new Set<string>();
  $effect(() => {
    const active = new Set(
      children.duplicateNames.map((name) => JSON.stringify([layout.path, name])),
    );
    for (const name of children.duplicateNames) {
      if (reportedDuplicateChildren.has(JSON.stringify([layout.path, name]))) continue;
      reportDiagnostic('template.duplicateChild', {
        severity: 'warning',
        message: 'Several template children have the same name; the last is used.',
        path: layout.path,
        details: { name },
      });
    }
    reportedDuplicateChildren = active;
  });
  setContext<NativeTemplateSlotContext>(nativeTemplateSlotContext, {
    get elements() {
      return elements;
    },
    get schema() {
      return layout.schema;
    },
    get path() {
      return layout.path;
    },
    get enabled() {
      return layout.enabled;
    },
    get renderers() {
      return layout.renderers;
    },
    get cells() {
      return layout.cells;
    },
  });
  const liveContext = $derived.by(() => {
    Object.values(context);
    return new Proxy(context, {});
  });
  const templateProps = $derived<NativeTemplateProps>({
    data: form.core?.data,
    errors: form.core?.errors ?? [],
    context: liveContext,
    elements: effectiveChildren,
    schema: layout.schema,
    path: layout.path,
    enabled: layout.enabled,
    readonly:
      form.readonly === true || ('readOnly' in layout.schema && layout.schema.readOnly === true),
    urlPolicy: resolveUrlPolicy(form.config),
    translate: (key, fallback = '') => translator.value(key, fallback),
    Slot: NativeTemplateSlot,
  });
  const slotContexts = getAllContexts();
  // Disposal bookkeeping is not consumed by rendering or reactive effects.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const slotDisposers = new Set<() => Promise<void>>();
  const mountSlot: NativeTemplateMountSlot = (target, name, onmissing) => {
    const instance = mount(NativeTemplateSlot, {
      target,
      props: { name, onmissing },
      context: slotContexts,
    });
    let disposed = false;
    const destroy = async () => {
      if (disposed) return;
      disposed = true;
      slotDisposers.delete(destroy);
      await unmount(instance);
    };
    slotDisposers.add(destroy);
    return destroy;
  };
  $effect(() => {
    const current = descriptor;
    const target = bridgeTarget;
    if (!current || !target) return;
    bridgeError = false;
    try {
      const handle = untrack(() =>
        current.mount(target, templateProps, mountSlot, reportNativeFailure),
      );
      bridgeHandle = handle;
      return () => {
        bridgeHandle = undefined;
        void handle.destroy();
      };
    } catch {
      bridgeError = true;
      reportNativeFailure();
    }
  });
  $effect(() => {
    bridgeHandle?.update(templateProps);
  });
  onDestroy(() => {
    for (const dispose of slotDisposers) void dispose();
  });
</script>

{#if layout.visible}
  {#if descriptor}
    <div bind:this={bridgeTarget} style="display: contents"></div>
    {#if bridgeError}<div role="alert">
        {message('TemplateLayoutRenderer.template_error_title')}
      </div>{/if}
  {:else if Template}
    <svelte:boundary onerror={reportNativeFailure}>
      <Template {...templateProps} />
      {#snippet failed()}
        <div role="alert">
          {message('TemplateLayoutRenderer.template_error_title')}
        </div>
      {/snippet}
    </svelte:boundary>
  {/if}
{/if}
