<script lang="ts">
  import { type RendererProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    ButtonActionContent,
    useButtonAction,
    type ButtonElement,
  } from '@chobantonov/jsonforms-svelte-extended';
  import { useStyles } from '@chobantonov/jsonforms-svelte-flowbite';
  import { Button } from 'flowbite-svelte';
  import type { ComponentProps } from 'svelte';
  import { twMerge } from 'tailwind-merge';
  import { mapButtonColorToFlowbiteColor } from './buttonColors';

  const props: RendererProps<ButtonElement> = $props();
  const action = useButtonAction(props);
  const { binding } = action;
  const { loading } = $derived(action);
  const styles = useStyles(binding.button.uischema);

  type NativeButtonOverrides = Record<string, unknown> & {
    color?: ComponentProps<typeof Button>['color'];
    class?: Parameters<typeof twMerge>[number];
  };

  const buttonColor = $derived.by(() => mapButtonColorToFlowbiteColor(binding.button.color));

  const buttonProps = $derived.by(() => {
    const extraProps = action.buttonOptions<NativeButtonOverrides>('flowbite.Button');

    return {
      ...extraProps,
      ...action.buttonAttributes,
      color: extraProps.color ?? buttonColor,
      loading,
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
</script>

<ButtonActionContent {action}>
  {#snippet button(label)}
    <Button {...buttonProps}>{@render label()}</Button>
  {/snippet}
</ButtonActionContent>
