import get from 'lodash/get';
import isPlainObject from 'lodash/isPlainObject';
import {
  mergeRendererOptions,
  useUIDiagnosticReporter,
  usePendingControlAction,
  type RendererProps,
} from '@chobantonov/jsonforms-svelte-renderer-common';
import {
  useJsonFormsButton,
  useFormContext,
  useHostRevision,
} from '../jsonFormsCompositions.svelte';
import {
  executeButtonScript,
  normalizeActionParams,
  scriptEvaluationAllowed,
  type ButtonScriptResult,
} from './buttonScript';
import type { ActionEvent, ButtonElement } from './types';
import cloneDeep from 'lodash/cloneDeep';
import isEqual from 'lodash/isEqual';

export function useButtonAction(props: RendererProps<ButtonElement>) {
  const reportDiagnostic = useUIDiagnosticReporter();
  const binding = useJsonFormsButton(props);
  const options = $derived(
    mergeRendererOptions(binding.button.config, binding.button.uischema.options),
  );
  function buttonOptions<T extends Record<string, unknown>>(path: string): Partial<T> {
    const value = get(options, path);
    return value && isPlainObject(value) ? (value as Partial<T>) : {};
  }
  const prepareAction = usePendingControlAction();
  const formContext = useFormContext();
  const currentHostRevision = useHostRevision();
  let loading = $state(false);
  let running = false;
  let scriptResult = $state<ButtonScriptResult>();
  const scriptDenied = $derived(
    binding.button.visible &&
      binding.button.action === undefined &&
      typeof binding.button.script === 'string' &&
      !scriptEvaluationAllowed(binding.button.config),
  );
  let reportedScriptDenial = false;
  $effect(() => {
    if (scriptDenied && !reportedScriptDenial)
      reportDiagnostic('script.evaluationDisabled', {
        severity: 'warning',
        message: 'Button script evaluation is disabled by host policy.',
        details: { capability: 'button', path: props.path ?? '' },
      });
    reportedScriptDenial = scriptDenied;
  });

  async function click(event: MouseEvent) {
    if (running || !binding.button.enabled) {
      return;
    }

    const target = (event.currentTarget as HTMLButtonElement | null) ?? document.body;
    const hostRevision = currentHostRevision();
    const element = binding.button.uischema;
    const action = binding.button.action;
    const script = binding.button.script;
    const path = props.path;
    const schema = formContext.schema;
    const rootUiSchema = formContext.uischema;
    const config = formContext.config;
    const sameAfterFlush = () =>
      binding.button.enabled &&
      binding.button.visible &&
      isEqual(binding.button.uischema, element) &&
      binding.button.action === action &&
      binding.button.script === script &&
      props.path === path &&
      isEqual(formContext.schema, schema) &&
      isEqual(formContext.uischema, rootUiSchema) &&
      isEqual(formContext.config, config);
    const sameTarget = () =>
      binding.button.enabled &&
      binding.button.visible &&
      currentHostRevision() === hostRevision &&
      binding.button.uischema === element &&
      binding.button.action === action &&
      binding.button.script === script &&
      props.path === path;
    let flushedData: unknown;

    running = true;
    loading = true;
    scriptResult = undefined;

    try {
      if (
        !(await prepareAction(sameTarget, () => {
          flushedData = cloneDeep(formContext.data);
          return () => sameAfterFlush() && isEqual(formContext.data, flushedData);
        })) ||
        !sameAfterFlush() ||
        !isEqual(formContext.data, flushedData)
      )
        return;
      if (binding.button.action !== undefined || binding.button.script === undefined) {
        await formContext.fireActionEvent?.(
          binding.button.action ?? '',
          normalizeActionParams(binding.button.params),
          target,
          binding.button.uischema,
        );
      } else if (binding.button.script) {
        const source: ActionEvent = {
          action: binding.button.action ?? '',
          context: formContext,
          params: normalizeActionParams(binding.button.params),
          $el: target,
          element: binding.button.uischema,
        };

        scriptResult = await executeButtonScript(
          binding.button.script,
          source,
          binding.button.config,
          reportDiagnostic,
        );
      }
    } finally {
      running = false;
      loading = false;
    }
  }

  return {
    binding,
    buttonOptions,
    get buttonAttributes() {
      return {
        type: 'button' as const,
        disabled: !binding.button.enabled || loading,
        'aria-busy': loading || undefined,
        onclick: click,
      };
    },
    click,
    get loading() {
      return loading;
    },
    get scriptResult() {
      return scriptResult;
    },
    get scriptDenied() {
      return scriptDenied;
    },
  };
}
