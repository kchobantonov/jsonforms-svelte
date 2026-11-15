<script lang="ts">
  import { useUIDiagnosticReporter } from '@chobantonov/jsonforms-svelte';
  import { mergeRendererOptions, usePendingControlAction } from '@chobantonov/jsonforms-svelte';
  import { useRendererMessages, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import {
    executeButtonScript,
    normalizeActionParams,
    toButtonSemanticColor,
    scriptEvaluationAllowed,
    type ButtonScriptResult,
    useFormContext,
    useHostRevision,
    useJsonFormsButton,
    type ActionEvent,
    type ButtonElement,
  } from '@chobantonov/jsonforms-svelte-extended';
  import { useStyles } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Button, type ButtonVariant } from '@jsonforms-svelte-shadcn-ui/button';
  import get from 'lodash/get';
  import isPlainObject from 'lodash/isPlainObject';
  import cloneDeep from 'lodash/cloneDeep';
  import isEqual from 'lodash/isEqual';
  import { twMerge } from 'tailwind-merge';
  import { mapButtonColorToShadcnVariant } from './buttonColors';

  const reportDiagnostic = useUIDiagnosticReporter();
  const props: RendererProps<ButtonElement> = $props();
  const binding = useJsonFormsButton(props);
  const prepareAction = usePendingControlAction();
  const formContext = useFormContext();
  const currentHostRevision = useHostRevision();
  const styles = useStyles(binding.button.uischema);
  let loading = $state(false);
  let running = false;
  let scriptResult = $state<ButtonScriptResult>();
  const message = useRendererMessages();
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

  type ComponentProps = Record<string, unknown> & { class?: string; variant?: ButtonVariant };

  const appliedOptions = $derived.by<Record<string, unknown>>(() =>
    mergeRendererOptions(binding.button.config, binding.button.uischema.options),
  );

  const shadcnProps = (path: string): ComponentProps => {
    const props = get(appliedOptions, path);
    return props && isPlainObject(props) ? (props as ComponentProps) : {};
  };

  const buttonProps = $derived.by(() => {
    const extraProps = shadcnProps('button');

    return {
      ...extraProps,
      type: 'button' as const,
      variant: extraProps.variant ?? mapButtonColorToShadcnVariant(binding.button.color),
      disabled: !binding.button.enabled || loading,
      class: twMerge(
        'inline-flex items-center gap-2',
        toButtonSemanticColor(binding.button.color) === 'warning' && 'text-destructive',
        extraProps.class,
        binding.button.uischema.options?.fullWidth === true && 'w-full',
      ),
      'aria-busy': loading || undefined,
    };
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
</script>

{#if binding.button.visible}
  <div class={twMerge('w-full', styles.value?.control?.root)}>
    {#if scriptDenied}
      <p role="status" data-button-diagnostic="script.evaluationDisabled">
        {message('button.scriptDisabled')}
      </p>
    {:else}
      <Button {...buttonProps} onclick={click}>
        {#if binding.button.icon}
          <span aria-hidden="true" class="shrink-0">{binding.button.icon}</span>
        {/if}
        {#if binding.button.label}
          <span>{loading ? `${binding.button.label}...` : binding.button.label}</span>
        {:else if loading}
          <span>{message('button.running')}</span>
        {/if}
      </Button>
    {/if}
    {#if scriptResult === 'unavailable'}
      <p role="status">
        {message('button.scriptUnavailable')}
      </p>
    {/if}
  </div>
{/if}
