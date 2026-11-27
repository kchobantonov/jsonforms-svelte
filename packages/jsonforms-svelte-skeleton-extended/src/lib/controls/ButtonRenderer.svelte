<script lang="ts">
  import { type RendererProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    ButtonActionContent,
    useButtonAction,
    type ButtonElement,
  } from '@chobantonov/jsonforms-svelte-extended';
  import { useStyles } from '@chobantonov/jsonforms-svelte-skeleton';
  import { twMerge } from 'tailwind-merge';
  import { mapButtonColorToSkeletonClass } from './buttonColors';

  const props: RendererProps<ButtonElement> = $props();
  const action = useButtonAction(props);
  const { binding } = action;
  const styles = useStyles(binding.button.uischema);

  type NativeButtonOverrides = Record<string, unknown> & {
    class?: Parameters<typeof twMerge>[number];
  };

  const colorClass = $derived.by(() => mapButtonColorToSkeletonClass(binding.button.color));

  const buttonProps = $derived.by(() => {
    const extraProps = action.buttonOptions<NativeButtonOverrides>('button');

    return {
      ...extraProps,
      ...action.buttonAttributes,
      class: twMerge(
        'btn btn-sm inline-flex items-center gap-2',
        colorClass,
        extraProps.class,
        binding.button.uischema.options?.fullWidth === true && 'w-full',
      ),
    };
  });
</script>

<ButtonActionContent
  {action}
  attributes={buttonProps}
  class={twMerge('w-full', styles.value?.control?.root)}
/>
