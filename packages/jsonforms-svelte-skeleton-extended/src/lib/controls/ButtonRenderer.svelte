<script lang="ts">
  import { type RendererProps } from '@chobantonov/jsonforms-svelte';
  import {
    AsyncFunction,
    useFormContext,
    useJsonFormsButton,
    type ActionEvent,
    type ButtonElement,
  } from '@chobantonov/jsonforms-svelte-extended';
  import { useStyles } from '@chobantonov/jsonforms-svelte-skeleton';
  import cloneDeep from 'lodash/cloneDeep';
  import get from 'lodash/get';
  import isPlainObject from 'lodash/isPlainObject';
  import merge from 'lodash/merge';
  import { twMerge } from 'tailwind-merge';
  import { mapButtonColorToSkeletonClass } from './buttonColors';

  const props: RendererProps<ButtonElement> = $props();
  const binding = useJsonFormsButton(props);
  const formContext = useFormContext();
  const styles = useStyles(binding.button.uischema);
  let loading = $state(false);

  const appliedOptions = $derived.by<Record<string, any>>(() =>
    merge({}, cloneDeep(binding.button.config), cloneDeep(binding.button.uischema.options)),
  );

  const skeletonProps = (path: string): Record<string, any> => {
    const props = get(appliedOptions, path);
    return props && isPlainObject(props) ? props : {};
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
      ),
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
    <button {...buttonProps} onclick={click}>
      {#if binding.button.icon}
        <span aria-hidden="true" class="shrink-0">{binding.button.icon}</span>
      {/if}
      {#if binding.button.label}
        <span>{loading ? `${binding.button.label}...` : binding.button.label}</span>
      {:else if loading}
        <span>Running...</span>
      {/if}
    </button>
  </div>
{/if}
