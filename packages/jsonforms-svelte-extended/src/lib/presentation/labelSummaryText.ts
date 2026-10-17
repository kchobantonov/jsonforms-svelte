import { mapStateToLabelProps, type JsonFormsState, type LabelElement } from '@jsonforms/core';
import { ruleValidationElement, ruleValidationState } from '@chobantonov/jsonforms-svelte';
import {
  buildNamespaceScope,
  buildTextScope,
  dynamicValuesEnabled,
  hasExpressions,
  splitTemplate,
} from './interpolate';
import { markdownProfile, resolveMarkup } from './markup';
import { escapeMarkdown } from './markdownEscape';
import type * as Markdown from './markdown';
import type * as Evaluator from './celTemplate';

/** Uses the same Label translation, parameter grammar and access gate as presentation. */
export function labelSummaryText(
  state: JsonFormsState,
  label: LabelElement,
  path: string,
  item: unknown,
  context: unknown,
  evaluator?: typeof Evaluator,
  markdown?: Pick<typeof Markdown, 'markdownPlainText'>,
): string {
  const mapped = mapStateToLabelProps(ruleValidationState(state), {
    uischema: ruleValidationElement(label),
    path,
  });
  if (!mapped.visible) return '';
  const text = mapped.text ?? '';
  const form = state.jsonforms;
  const request = resolveMarkup(label.options, form.config);
  const displayed = (source: string) =>
    request.markdown
      ? (markdown?.markdownPlainText(source, markdownProfile(form.config)) ?? '')
      : source;
  if (!request.interpolate) return displayed(text);
  const segments = splitTemplate(text);
  if (!hasExpressions(segments))
    return displayed(
      segments.map((segment) => (segment.kind === 'literal' ? segment.text : '')).join(''),
    );
  // Search cannot expose an authored expression while the optional evaluator loads.
  if (!evaluator) return '';
  const namespace = buildNamespaceScope({
    data: form.core?.data,
    item,
    config: form.config,
    context,
    locale: form.i18n?.locale,
    dynamicAllowed: dynamicValuesEnabled(form.config),
  });
  const resolved = evaluator.resolveTextParams(
    label.options?.textParams,
    namespace,
    form.i18n?.locale,
    form.i18n?.translate,
  );
  return displayed(
    evaluator.renderTemplate(
      segments,
      buildTextScope(resolved.params, form.i18n?.locale),
      request.markdown ? escapeMarkdown : undefined,
      form.i18n?.locale,
      form.i18n?.translate,
    ).text,
  );
}
