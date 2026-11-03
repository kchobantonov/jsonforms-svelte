import {
  ruleValidationElement,
  ruleValidationState,
  useUIDiagnosticReporter,
} from '@chobantonov/jsonforms-svelte';
import { useJsonForms, withReactiveProps, type RendererProps } from '@chobantonov/jsonforms-svelte';
import {
  getAjv,
  getCells,
  getConfig,
  getData,
  getI18nKeyPrefixBySchema,
  getRenderers,
  getTranslator,
  hasShowRule,
  isInherentlyEnabled,
  isVisible,
  type JsonFormsState,
  type OwnPropsOfRenderer,
} from '@jsonforms/core';
import { getContext } from 'svelte';
import {
  FormContextSymbol,
  HostRevisionContextSymbol,
  type ButtonElement,
  type FormContext,
} from './core/types.js';

export interface OwnPropsOfButton extends OwnPropsOfRenderer {
  uischema: ButtonElement;
  pathSegments?: readonly string[];
}

export const mapStateToButtonProps = (state: JsonFormsState, ownProps: OwnPropsOfButton) => {
  state = ruleValidationState(state);
  const rootData = getData(state);
  const uischema = ruleValidationElement(
    ownProps.uischema,
    getAjv(state),
    ownProps.pathSegments ?? (ownProps.path ? ownProps.path.split('.') : []),
  );
  const config = getConfig(state);

  const visible =
    ownProps.visible === undefined || hasShowRule(uischema)
      ? isVisible(uischema, rootData, ownProps.path ?? '', getAjv(state), config)
      : ownProps.visible;

  const label = uischema.label;
  const t = getTranslator()(state);
  const i18nKeyPrefix = getI18nKeyPrefixBySchema(undefined, uischema);
  const i18nKey = i18nKeyPrefix ? `${i18nKeyPrefix}.label` : (label ?? '');
  const i18nText = t(i18nKey, label, { uischema });

  const enabled = isInherentlyEnabled(state, ownProps, uischema, undefined, rootData, config);

  return {
    label: i18nText,
    icon: uischema.icon,
    action: uischema.action ?? (uischema.script === undefined ? uischema.name : undefined),
    script: uischema.script,
    params: uischema.params,
    visible,
    enabled: enabled && uischema.options?.disabled !== true,
    color: uischema.color,
    config,
    renderers: ownProps.renderers || getRenderers(state),
    cells: ownProps.cells || getCells(state),
  };
};

export const useJsonFormsButton = (props: RendererProps<ButtonElement>) => {
  const jsonforms = useJsonForms();
  const reportDiagnostic = useUIDiagnosticReporter();
  const mappedState = $derived(
    mapStateToButtonProps({ jsonforms }, props as RendererProps<ButtonElement> & OwnPropsOfButton),
  );
  const button = $derived.by(() => withReactiveProps(props, mappedState));
  let warnedConflict: { action: unknown; script: unknown; path: string } | undefined;
  $effect(() => {
    const current = button;
    const path = props.path ?? '';
    if (current.visible && current.action !== undefined && current.script !== undefined) {
      if (
        !warnedConflict ||
        warnedConflict.action !== current.action ||
        warnedConflict.script !== current.script ||
        warnedConflict.path !== path
      )
        reportDiagnostic('action.conflict', {
          severity: 'warning',
          message: 'Button declares both an action and a script; the action is used.',
          details: { action: current.action, path },
        });
      warnedConflict = { action: current.action, script: current.script, path };
    } else warnedConflict = undefined;
  });

  return {
    get button() {
      return button;
    },
  };
};

export function useFormContext(): FormContext;
export function useFormContext(optional: true): FormContext | undefined;
export function useFormContext(optional?: true) {
  const formContext = getContext<FormContext>(FormContextSymbol);

  if (!formContext && !optional) {
    throw new Error("'formContext couldn't be injected. Are you within extended JSON Forms?");
  }

  return formContext;
}

/** Read the host-input revision without occupying a user context property. */
export function useHostRevision(): () => number {
  const source = getContext<{ readonly current: number }>(HostRevisionContextSymbol);
  if (!source) throw new Error('Host revision is only available inside extended JsonForms.');
  return () => source.current;
}
