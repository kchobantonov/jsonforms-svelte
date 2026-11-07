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
  let parsedText: string | undefined;
  let parsedSegments: ReturnType<typeof splitTemplate> = [];
  const stableSegments = (text: string) => {
    if (text !== parsedText) {
      parsedText = text;
      parsedSegments = splitTemplate(text);
    }
    return parsedSegments;
  };
  const request = $derived(resolveMarkup(props.uischema.options, form.config));
  const profile = $derived(markdownProfile(form.config));
  const policy = $derived(resolveUrlPolicy(form.config));
  const segments = $derived(request.interpolate ? stableSegments(binding.label.text) : undefined);
  const expressions = $derived(segments && hasExpressions(segments) ? segments : undefined);
  const literals = $derived(
    segments
      ? segments.map((segment) => (segment.kind === 'literal' ? segment.text : '')).join('')
      : binding.label.text,
  );
  const textParams = $derived(
    props.uischema.options?.textParams as Record<string, unknown> | undefined,
  );
  const hasExpressionParams = $derived(
    Object.values(textParams ?? {}).some(
      (value) => typeof value === 'string' && hasExpressions(splitTemplate(value)),
    ),
  );
  const reserved = $derived(reservedParamNames(textParams));
  const namespace = $derived(
    buildNamespaceScope({
      data: hasExpressionParams ? form.core?.data : undefined,
      item: hasExpressionParams
        ? collectionItem?.hasSourceItem
          ? collectionItem.sourceItem
          : nearestArrayItem(form.core?.data, props.pathSegments ?? dataPathSegments(props.path))
        : undefined,
      config: form.config,
      context: hostContext,
      locale: form.i18n?.locale,
      dynamicAllowed: dynamicValuesEnabled(form.config),
    }),
  );
  const markdown = $derived(request.markdown ? loadMarkdown() : undefined);
  const message = usePresentationMessages();
  type Evaluator = Awaited<ReturnType<typeof loadInterpolation>>;
  let loadedEvaluator = $state<Evaluator | undefined>();
  let interpolationLoadFailed = $state(false);
  $effect(() => {
    if (!expressions || loadedEvaluator || interpolationLoadFailed) return;
    let active = true;
    loadInterpolation().then(
      (loaded) => {
        if (active) loadedEvaluator = loaded;
      },
      () => {
        if (active) interpolationLoadFailed = true;
      },
    );
    return () => {
      active = false;
    };
  });
  type Resolved = ReturnType<Evaluator['resolveTextParams']>;
  type Rendered = ReturnType<Evaluator['renderTemplate']>;
  let interpolationCache:
    | { keys: unknown[]; value: { resolved: Resolved; rendered: Rendered } }
    | undefined;
  const interpolated = (loaded: Evaluator) => {
    const locale = form.i18n?.locale;
    const translate = form.i18n?.translate;
    const keys = [
      loaded,
      textParams,
      hasExpressionParams ? namespace : undefined,
      expressions,
      locale,
      translate,
      request.markdown,
    ];
    if (interpolationCache?.keys.every((value, index) => value === keys[index])) {
      return interpolationCache.value;
    }
    const resolved = loaded.resolveTextParams(textParams, namespace, locale, translate);
    const rendered = loaded.renderTemplate(
      expressions!,
      buildTextScope(resolved.params, locale),
      request.markdown ? escapeMarkdownSubstitution : undefined,
      locale,
      translate,
    );
    const value = { resolved, rendered };
    interpolationCache = { keys, value };
    return value;
  };
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
    {#if loadedEvaluator}
      {@const { resolved, rendered } = interpolated(loadedEvaluator)}
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
    {:else if interpolationLoadFailed}
      {@render body(literals)}
      <AuthorFailureDiagnostic
        code="markup.interpolationLoadFailed"
        message="Text interpolation could not be loaded."
        path={props.path}
      />
      <p role="alert" data-markup-diagnostic="interpolationFailed">
        {message('interpolationLoadFailed')}
      </p>
    {:else}<span role="status" aria-busy="true">…</span>{/if}
  {:else}{@render body(literals)}{/if}
{/if}
