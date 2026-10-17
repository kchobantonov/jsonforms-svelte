<script lang="ts">
  import {
    useJsonForms,
    useJsonFormsLabel,
    resolveUrlPolicy,
    type RendererProps,
  } from '@chobantonov/jsonforms-svelte';
  import type { LabelElement } from '@jsonforms/core';
  import { useFormContext } from '../jsonFormsCompositions.svelte';
  import { markdownProfile, resolveMarkup } from '../presentation/markup';
  import { usePresentationMessages } from '../presentation/messages.svelte';
  import {
    buildNamespaceScope,
    buildTextScope,
    dynamicValuesEnabled,
    hasExpressions,
    reservedParamNames,
    splitTemplate,
  } from '../presentation/interpolate';
  import { escapeMarkdown } from '../presentation/markdownEscape';
  import { loadMarkdown, loadInterpolation } from '../presentation/loaders';
  import { nearestArrayItem } from '../presentation/itemContext';

  const props: RendererProps<LabelElement> = $props();
  const binding = useJsonFormsLabel(props);
  const form = useJsonForms();
  const hostContext = useFormContext(true);
  const request = $derived(resolveMarkup(props.uischema.options, form.config));
  const profile = $derived(markdownProfile(form.config));
  const policy = $derived(resolveUrlPolicy(form.config));
  const segments = $derived(request.interpolate ? splitTemplate(binding.label.text) : undefined);
  const expressions = $derived(segments && hasExpressions(segments) ? segments : undefined);
  const literals = $derived(
    segments
      ? segments.map((segment) => (segment.kind === 'literal' ? segment.text : '')).join('')
      : binding.label.text,
  );
  const textParams = $derived(
    props.uischema.options?.textParams as Record<string, unknown> | undefined,
  );
  const reserved = $derived(reservedParamNames(textParams));
  const namespace = $derived(
    buildNamespaceScope({
      data: form.core?.data,
      item: nearestArrayItem(form.core?.data, props.path === '' ? [] : props.path.split('.')),
      config: form.config,
      context: hostContext,
      locale: form.i18n?.locale,
      dynamicAllowed: dynamicValuesEnabled(form.config),
    }),
  );
  const evaluator = $derived(expressions ? loadInterpolation() : undefined);
  const markdown = $derived(request.markdown ? loadMarkdown() : undefined);
  const message = usePresentationMessages();
</script>

{#snippet body(text: string)}
  {#if request.markdown}
    {#await markdown}<span>{text}</span>
    {:then loaded}
      {#if loaded}
        {@const Markdown = loaded.default}
        <Markdown {text} {profile} urlPolicy={policy} typography={request.typography} />
      {/if}
    {:catch}
      <span>{text}</span>
      <p role="alert" data-markup-diagnostic="loadFailed">{message('loadFailed')}</p>
    {/await}
  {:else}<span>{text}</span>{/if}
{/snippet}

{#if binding.label.visible}
  {#if request.diagnostic}<p role="alert" data-markup-diagnostic={request.diagnostic}>
      {message(request.diagnostic)}
    </p>{/if}
  {#if expressions}
    {#await evaluator}<span role="status" aria-busy="true">…</span>
    {:then loaded}
      {#if loaded}
        {@const resolved = loaded.resolveTextParams(
          textParams,
          namespace,
          form.i18n?.locale,
          form.i18n?.translate,
        )}
        {@const rendered = loaded.renderTemplate(
          expressions,
          buildTextScope(resolved.params, form.i18n?.locale),
          request.markdown ? escapeMarkdown : undefined,
          form.i18n?.locale,
          form.i18n?.translate,
        )}
        {@render body(rendered.text)}
        {#if resolved.failures.length || rendered.failures.length || reserved.length}
          <p role="alert" data-markup-diagnostic="interpolationFailed">
            {message('interpolationFailed', {
              detail: [
                ...resolved.failures,
                ...rendered.failures,
                ...reserved.map((name) => `textParams.${name} is reserved`),
              ].join('; '),
            })}
          </p>
        {/if}
      {/if}
    {:catch}
      {@render body(literals)}
      <p role="alert" data-markup-diagnostic="interpolationFailed">
        {message('interpolationLoadFailed')}
      </p>
    {/await}
  {:else}{@render body(literals)}{/if}
{/if}
