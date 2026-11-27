<script lang="ts">
  import {
    useDynamicTreeResolver,
    useJsonFormsLayout,
    useRendererMessages,
    useUIDiagnosticReporter,
    type RendererProps,
    resolveUrlPolicy,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  const resolveTree = useDynamicTreeResolver();
  import { getAllContexts, mount, unmount, untrack, onDestroy, setContext } from 'svelte';
  import { useJsonForms, useTranslator } from '@chobantonov/jsonforms-svelte';
  import type { Layout } from '@jsonforms/core';
  import {
    nativeTemplateSlotContext,
    type NativeTemplateSlotContext,
    type NativeTemplateLayout,
    type NativeTemplateProps,
    type NativeTemplateDescriptor,
    type NativeTemplateHandle,
    type NativeTemplateMountSlot,
  } from '../template/nativeTemplate';
  import { useTemplateChildren } from '../template/useTemplateChildren.svelte';
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
  const children = useTemplateChildren(
    () => layout.uischema.elements ?? [],
    () => layout.path,
    () => resolveTree,
    reportDiagnostic,
  );
  setContext<NativeTemplateSlotContext>(nativeTemplateSlotContext, {
    get elements() {
      return children.byName;
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
    elements: children.elements,
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
