<script lang="ts">
  import { type RendererProps } from '@chobantonov/jsonforms-svelte';
  import {
    AsyncFunction,
    useFormContext,
    useJsonFormsButton,
    type ActionEvent,
    type ButtonElement,
  } from '@chobantonov/jsonforms-svelte-extended';
  import { useStyles } from '@chobantonov/jsonforms-svelte-flowbite';
  import { Button } from 'flowbite-svelte';
  import cloneDeep from 'lodash/cloneDeep';
  import get from 'lodash/get';
  import isPlainObject from 'lodash/isPlainObject';
  import merge from 'lodash/merge';
  import { twMerge } from 'tailwind-merge';
  import { mapButtonColorToFlowbiteColor } from './buttonColors';

  const props: RendererProps<ButtonElement> = $props();
  const binding = useJsonFormsButton(props);
  const formContext = useFormContext();
  const styles = useStyles(binding.button.uischema);
  let loading = $state(false);

  const appliedOptions = $derived.by<Record<string, any>>(() =>
    merge({}, cloneDeep(binding.button.config), cloneDeep(binding.button.uischema.options)),
  );

  const flowbiteProps = (path: string): Record<string, any> => {
    const props = get(appliedOptions, `flowbite.${path}`);
    return props && isPlainObject(props) ? props : {};
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
      class: twMerge(
        'inline-flex items-center gap-2',
        styles.value?.control?.input,
        extraProps.class,
      ),
    };
  });

  async function click(event: MouseEvent) {
    if (loading || !binding.button.enabled) {
      return;
    }

    const target = (event.currentTarget as HTMLButtonElement | null) ?? document.body;

    loading = true;

    try {
      if (binding.button.action) {
        await formContext.fireActionEvent?.(binding.button.action, binding.button.params, target);
      } else if (binding.button.script) {
        const source: ActionEvent = {
          action: binding.button.action ?? '',
          context: formContext,
          params: binding.button.params ? { ...binding.button.params } : {},
          $el: target,
        };

        await new AsyncFunction(binding.button.script).call(source);
      }
    } finally {
      loading = false;
    }
  }
</script>

{#if binding.button.visible}
  <div class="w-full">
    <Button {...buttonProps} onclick={click}>
      {#if binding.button.icon}
        <span aria-hidden="true" class="shrink-0">{binding.button.icon}</span>
      {/if}
      {#if binding.button.label}
        <span>{loading ? `${binding.button.label}...` : binding.button.label}</span>
      {:else if loading}
        <span>Running...</span>
      {/if}
    </Button>
  </div>
{/if}
