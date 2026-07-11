<script lang="ts">
  import { type RendererProps } from '@chobantonov/jsonforms-svelte';
  import {
    AsyncFunction,
    useFormContext,
    useJsonFormsButton,
    type ActionEvent,
    type ButtonElement,
  } from '@chobantonov/jsonforms-svelte-extended';
  import { Button, useStyles } from '@chobantonov/jsonforms-svelte-shadcn';
  import cloneDeep from 'lodash/cloneDeep';
  import get from 'lodash/get';
  import isPlainObject from 'lodash/isPlainObject';
  import merge from 'lodash/merge';
  import { twMerge } from 'tailwind-merge';
  import { mapButtonColorToShadcnClass } from './buttonColors';

  const props: RendererProps<ButtonElement> = $props();
  const binding = useJsonFormsButton(props);
  const formContext = useFormContext();
  const styles = useStyles(binding.button.uischema);
  let loading = $state(false);

  type ComponentProps = Record<string, unknown> & { class?: string };

  const appliedOptions = $derived.by<Record<string, unknown>>(() =>
    merge({}, cloneDeep(binding.button.config), cloneDeep(binding.button.uischema.options)),
  );

  const shadcnProps = (path: string): ComponentProps => {
    const props = get(appliedOptions, path);
    return props && isPlainObject(props) ? (props as ComponentProps) : {};
  };

  const colorClass = $derived.by(() => mapButtonColorToShadcnClass(binding.button.color));

  const buttonProps = $derived.by(() => {
    const extraProps = shadcnProps('button');

    return {
      ...extraProps,
      type: 'button' as const,
      disabled: !binding.button.enabled || loading,
      class: twMerge('inline-flex items-center gap-2', colorClass, extraProps.class),
      'aria-busy': loading || undefined,
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
  <div class={twMerge('w-full', styles.value?.control?.root)}>
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
