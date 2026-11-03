<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import {
    useJsonForms,
    useJsonFormsLabel,
    useCollectionItemIdentity,
    dataPathSegments,
    resolveUrlPolicy,
    useUIDiagnosticReporter,
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
  import { escapeMarkdownSubstitution } from '../presentation/markdownEscape';
  import { loadMarkdown, loadInterpolation } from '../presentation/loaders';
  import { nearestArrayItem } from '../presentation/itemContext';
  import AuthorFailureDiagnostic from '../presentation/AuthorFailureDiagnostic.svelte';

  type TypographyProps = { block: boolean; children: Snippet };
  // eslint-disable-next-line svelte/no-unused-props -- The reactive renderer props are read through their object.
  const props: RendererProps<LabelElement> & {
    typographyComponent?: Component<TypographyProps>;
  } = $props();
  const binding = useJsonFormsLabel(props);
  const form = useJsonForms();
  const reportDiagnostic = useUIDiagnosticReporter();
  const collectionItem = useCollectionItemIdentity();
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
      item: collectionItem?.hasSourceItem
        ? collectionItem.sourceItem
        : nearestArrayItem(form.core?.data, props.pathSegments ?? dataPathSegments(props.path)),
      config: form.config,
      context: hostContext,
      locale: form.i18n?.locale,
      dynamicAllowed: dynamicValuesEnabled(form.config),
    }),
  );
  const evaluator = $derived(expressions ? loadInterpolation() : undefined);
  const markdown = $derived(request.markdown ? loadMarkdown() : undefined);
  const message = usePresentationMessages();
  let reported: string | undefined;
  $effect(() => {
    if (!binding.label.visible || !request.diagnostic) {
      reported = undefined;
      return;
    }
    const code =
      request.diagnostic === 'markdownDisabled' ? 'markup.markdownDisabled' : 'markup.unsupported';
    const path = props.path;
    const key = JSON.stringify([path, code]);
    if (reported === key) return;
    reported = key;
    reportDiagnostic(code, {
      severity: 'warning',
      message:
        request.diagnostic === 'markdownDisabled'
          ? 'Markdown is disabled by the host; text is shown plainly.'
          : 'Unsupported markup request; text is shown plainly.',
      path,
    });
  });
</script>

{#snippet content(text: string)}
  {#if request.markdown}
    {#await markdown}<span>{text}</span>
    {:then loaded}
      {#if loaded}
        {@const Markdown = loaded.default}
        <Markdown
          {text}
          {profile}
          urlPolicy={policy}
          typography={request.typography}
          path={props.path}
        />
      {/if}
    {:catch}
      <span>{text}</span>
      <AuthorFailureDiagnostic
        code="markup.loadFailed"
        message="Markdown could not be loaded; source text is shown plainly."
        path={props.path}
      />
    {/await}
  {:else}<span>{text}</span>{/if}
{/snippet}

{#snippet body(text: string)}
  {#if request.typography && props.typographyComponent}
    {@const Typography = props.typographyComponent}
    <Typography block={request.markdown}>{@render content(text)}</Typography>
  {:else}
    {@render content(text)}
  {/if}
{/snippet}

{#if binding.label.visible}
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
          request.markdown ? escapeMarkdownSubstitution : undefined,
          form.i18n?.locale,
          form.i18n?.translate,
        )}
        {@render body(rendered.text)}
        {#if resolved.failures.length || rendered.failures.length || reserved.length}
          <AuthorFailureDiagnostic
            code="markup.interpolationFailed"
            message="Text interpolation could not resolve one or more author expressions."
            path={props.path}
          />
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
      <AuthorFailureDiagnostic
        code="markup.interpolationLoadFailed"
        message="Text interpolation could not be loaded."
        path={props.path}
      />
      <p role="alert" data-markup-diagnostic="interpolationFailed">
        {message('interpolationLoadFailed')}
      </p>
    {/await}
  {:else}{@render body(literals)}{/if}
{/if}
