<script lang="ts">
  import { mergeRendererOptions, usePendingControlAction } from '@chobantonov/jsonforms-svelte';
  import { useRendererMessages, type RendererProps } from '@chobantonov/jsonforms-svelte';
  import {
    executeButtonScript,
    normalizeActionParams,
    scriptEvaluationAllowed,
    type ButtonScriptResult,
    useFormContext,
    useJsonFormsButton,
    type ActionEvent,
    type ButtonElement,
  } from '@chobantonov/jsonforms-svelte-extended';
  import { useStyles } from '@chobantonov/jsonforms-svelte-skeleton';
  import get from 'lodash/get';
  import isPlainObject from 'lodash/isPlainObject';
  import { twMerge } from 'tailwind-merge';
  import { mapButtonColorToSkeletonClass } from './buttonColors';

  const props: RendererProps<ButtonElement> = $props();
  const binding = useJsonFormsButton(props);
  const prepareAction = usePendingControlAction();
  const formContext = useFormContext();
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
      console.warn('script.evaluationDisabled', {
        message: 'Button script evaluation is disabled by host policy.',
        details: { capability: 'button', path: props.path ?? '' },
      });
    reportedScriptDenial = scriptDenied;
  });

  const appliedOptions = $derived.by<Record<string, unknown>>(() =>
    mergeRendererOptions(binding.button.config, binding.button.uischema.options),
  );

  type NativeButtonOverrides = Record<string, unknown> & {
    class?: Parameters<typeof twMerge>[number];
  };

  const skeletonProps = (path: string): NativeButtonOverrides => {
    const props = get(appliedOptions, path);
    return props && isPlainObject(props) ? (props as NativeButtonOverrides) : {};
  };

  const colorClass = $derived.by(() => mapButtonColorToSkeletonClass(binding.button.color));

  const buttonProps = $derived.by(() => {
    const extraProps = skeletonProps('button');

    return {
      ...extraProps,
      type: 'button' as const,
      disabled: !binding.button.enabled || loading,
      class: twMerge(
        'btn btn-sm inline-flex items-center gap-2',
        colorClass,
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

    running = true;
    loading = true;
    scriptResult = undefined;

    try {
      if (!(await prepareAction()) || !binding.button.enabled) return;
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
      <button {...buttonProps} onclick={click}>
        {#if binding.button.icon}
          <span aria-hidden="true" class="shrink-0">{binding.button.icon}</span>
        {/if}
        {#if binding.button.label}
          <span>{loading ? `${binding.button.label}...` : binding.button.label}</span>
        {:else if loading}
          <span>{message('button.running')}</span>
        {/if}
      </button>
    {/if}
    {#if scriptResult === 'unavailable'}
      <p role="status">
        {message('button.scriptUnavailable')}
      </p>
    {/if}
    {#if binding.button.action !== undefined && binding.button.script !== undefined}
      <p role="status" data-button-diagnostic="action.conflict" class="mt-1 text-sm">
        {message('button.actionConflict')}
      </p>
    {/if}
  </div>
{/if}
