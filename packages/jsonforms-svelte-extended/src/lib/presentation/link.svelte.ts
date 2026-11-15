import { deriveLabelForUISchemaElement, type Layout } from '@jsonforms/core';
import {
  isAllowedUrl,
  resolveUrlPolicy,
  useJsonForms,
  useJsonFormsLayout,
  useTranslator,
  type RendererProps,
} from '@chobantonov/jsonforms-svelte';
import { linkRel, type LinkElement } from './link';

/** Shared link semantics; each family supplies its native text-link presentation. */
export function useLink(props: RendererProps<Layout>) {
  const form = useJsonForms();
  const binding = useJsonFormsLayout(props);
  const translator = useTranslator();
  const element = $derived(props.uischema as LinkElement);
  const href = $derived(
    typeof element.href === 'string' &&
      element.href.trim() !== '' &&
      isAllowedUrl(element.href, resolveUrlPolicy(form.config))
      ? element.href
      : undefined,
  );
  const label = $derived(
    deriveLabelForUISchemaElement(element, translator.value) ?? element.label ?? element.href ?? '',
  );
  return {
    get visible() {
      return binding.layout.visible;
    },
    get href() {
      return href;
    },
    get label() {
      return label;
    },
    get target() {
      return element.target;
    },
    get rel() {
      return linkRel(element.target, element.rel);
    },
  };
}
