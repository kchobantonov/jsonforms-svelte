import { useRendererMessages } from './rendererMessages.svelte';
import type { Layout } from '@jsonforms/core';
import { useJsonForms, useTranslator, type RendererProps } from './jsonFormsCompositions.svelte';
import { resolveImageView, type ImageViewElement } from './imageView';

/** Shared source/policy handling; each family retains its native image presentation. */
export function useImageView(props: RendererProps<Layout>) {
  const jsonforms = useJsonForms();
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
      return resolved.diagnostics.map((diagnostic) => ({
        ...diagnostic,
        message: message(diagnostic.code),
      }));
    },
  };
}
