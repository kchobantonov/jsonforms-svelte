import { useRendererMessages } from './rendererMessages.svelte';
import type { Layout } from '@jsonforms/core';
import { useJsonForms, useTranslator, type RendererProps } from './jsonFormsCompositions.svelte';
import { resolveImageView, type ImageViewElement } from './imageView';
import { useUIDiagnosticReporter } from './authorDiagnostic.svelte';

/** Shared source/policy handling; each family retains its native image presentation. */
export function useImageView(props: RendererProps<Layout>) {
  const jsonforms = useJsonForms();
  const reportDiagnostic = useUIDiagnosticReporter();
  const message = useRendererMessages();
  const translator = useTranslator();
  const resolved = $derived(
    resolveImageView(props.uischema as ImageViewElement, {
      schema: props.schema,
      rootSchema: jsonforms.core?.schema,
      data: jsonforms.core?.data,
      path: props.path,
      config: jsonforms.config,
    }),
  );
  // These sets deduplicate author warnings and must not become effect dependencies.
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  let reported = new Set<string>();
  $effect(() => {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const active = new Set<string>();
    for (const diagnostic of resolved.diagnostics) {
      const path = props.path;
      const scope = (props.uischema as ImageViewElement).scope;
      const key = JSON.stringify([path, scope, diagnostic.code]);
      active.add(key);
      if (reported.has(key)) continue;
      reported.add(key);
      reportDiagnostic(diagnostic.code, {
        severity: diagnostic.severity,
        message: diagnostic.message,
        path,
        scope,
      });
    }
    reported = active;
  });
  return {
    get src() {
      return resolved.src;
    },
    get alt() {
      if (resolved.alt === '') return '';
      const prefix = (props.uischema as ImageViewElement).i18n;
      const key = prefix ? `${prefix}.alt` : resolved.alt;
      return translator.value(key, resolved.alt);
    },
    get diagnostics() {
      // A missing alt is an authoring problem, but the image still renders.
      // Keep it on the author channel without adding a warning to the form.
      return resolved.diagnostics
        .filter((diagnostic) => diagnostic.code !== 'image.missingAlt')
        .map((diagnostic) => ({
          ...diagnostic,
          message: message(diagnostic.code),
        }));
    },
  };
}
