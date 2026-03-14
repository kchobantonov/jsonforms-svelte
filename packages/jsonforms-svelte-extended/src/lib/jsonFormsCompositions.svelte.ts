import {
  useJsonForms,
  withReactiveProps,
  type RendererProps,
} from "@chobantonov/jsonforms-svelte";
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
} from "@jsonforms/core";
import { getContext } from "svelte";
import {
  FormContextSymbol,
  type ButtonElement,
  type FormContext,
} from "./types.js";

export interface OwnPropsOfButton extends OwnPropsOfRenderer {
  uischema: ButtonElement;
}

export const mapStateToButtonProps = (
  state: JsonFormsState,
  ownProps: OwnPropsOfButton,
) => {
  const rootData = getData(state);
  const { uischema } = ownProps;
  const config = getConfig(state);

  const visible =
    ownProps.visible === undefined || hasShowRule(uischema)
      ? isVisible(
          uischema,
          rootData,
          ownProps.path ?? "",
          getAjv(state),
          config,
        )
      : ownProps.visible;

  const label = uischema.label;
  const t = getTranslator()(state);
  const i18nKeyPrefix = getI18nKeyPrefixBySchema(undefined, uischema);
  const i18nKey = i18nKeyPrefix ? `${i18nKeyPrefix}.label` : (label ?? "");
  const i18nText = t(i18nKey, label, { uischema });

  const enabled = isInherentlyEnabled(
    state,
    ownProps,
    uischema,
    undefined,
    rootData,
    config,
  );

  return {
    label: i18nText,
    icon: uischema.icon,
    action: uischema.action,
    script: uischema.script,
    params: uischema.params,
    visible,
    enabled,
    color: uischema.color,
    config,
    renderers: ownProps.renderers || getRenderers(state),
    cells: ownProps.cells || getCells(state),
  };
};

export const useJsonFormsButton = (props: RendererProps<ButtonElement>) => {
  const jsonforms = useJsonForms();
  const mappedState = $derived(
    mapStateToButtonProps(
      { jsonforms },
      props as RendererProps<ButtonElement> & OwnPropsOfButton,
    ),
  );
  const button = $derived.by(() => withReactiveProps(props, mappedState));

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
    throw new Error(
      "'formContext couldn't be injected. Are you within extended JSON Forms?",
    );
  }

  return formContext;
}
