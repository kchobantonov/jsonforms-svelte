<script lang="ts">
  import { usePendingControlAction } from '@chobantonov/jsonforms-svelte';
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
  import { useStyles } from '@chobantonov/jsonforms-svelte-flowbite';
  import { Button } from 'flowbite-svelte';
  import type { ComponentProps } from 'svelte';
  import cloneDeep from 'lodash/cloneDeep';
  import get from 'lodash/get';
  import isPlainObject from 'lodash/isPlainObject';
  import merge from 'lodash/merge';
  import { twMerge } from 'tailwind-merge';
  import { mapButtonColorToFlowbiteColor } from './buttonColors';

  const props: RendererProps<ButtonElement> = $props();
  const binding = useJsonFormsButton(props);
  const prepareAction = usePendingControlAction();
  const formContext = useFormContext();
  const styles = useStyles(binding.button.uischema);
  let loading = $state(false);
  let running = false;
  let scriptResult = $state<ButtonScriptResult>();
  const message = useRendererMessages();

  const appliedOptions = $derived.by<Record<string, unknown>>(() =>
    merge({}, cloneDeep(binding.button.config), cloneDeep(binding.button.uischema.options)),
  );

  type NativeButtonOverrides = Record<string, unknown> & {
    color?: ComponentProps<typeof Button>['color'];
    class?: Parameters<typeof twMerge>[number];
  };

  const flowbiteProps = (path: string): NativeButtonOverrides => {
    const props = get(appliedOptions, `flowbite.${path}`);
    return props && isPlainObject(props) ? (props as NativeButtonOverrides) : {};
  };

  const buttonColor = $derived.by(() => mapButtonColorToFlowbiteColor(binding.button.color));

  const buttonProps = $derived.by(() => {
    const extraProps = flowbiteProps('Button');

    return {
      ...extraProps,
      type: 'button' as const,
      color: extraProps.color ?? buttonColor,
      disabled: !binding.button.enabled || loading,
      loading,
      'aria-busy': loading || undefined,
      class: twMerge(
        'inline-flex items-center gap-2',
        // Native yellow uses white text; keep its palette with a readable default label.
        buttonColor === 'yellow' &&
          extraProps.color === undefined &&
          extraProps.outline !== true &&
          'text-gray-900',
        styles.value?.control?.input,
        extraProps.class,
        binding.button.uischema.options?.fullWidth === true && 'w-full',
      ),
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
  <div class="w-full">
    {#if binding.button.action === undefined && typeof binding.button.script === 'string' && !scriptEvaluationAllowed(binding.button.config)}
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
    {#if binding.button.action !== undefined && binding.button.script !== undefined}
      <p role="status" data-button-diagnostic="action.conflict" class="mt-1 text-sm">
        {message('button.actionConflict')}
      </p>
    {/if}
  </div>
{/if}
