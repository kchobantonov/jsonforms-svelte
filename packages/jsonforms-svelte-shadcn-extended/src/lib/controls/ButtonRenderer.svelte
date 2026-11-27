<script lang="ts">
  import { type RendererProps } from '@chobantonov/jsonforms-svelte-renderer-common';
  import {
    toButtonSemanticColor,
    ButtonActionContent,
    useButtonAction,
    type ButtonElement,
  } from '@chobantonov/jsonforms-svelte-extended';
  import { useStyles } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Button, type ButtonVariant } from '@jsonforms-svelte-shadcn-ui/button';
  import { twMerge } from 'tailwind-merge';
  import { mapButtonColorToShadcnVariant } from './buttonColors';

  const props: RendererProps<ButtonElement> = $props();
  const action = useButtonAction(props);
  const { binding } = action;
  const styles = useStyles(binding.button.uischema);
  type ComponentProps = Record<string, unknown> & { class?: string; variant?: ButtonVariant };

  const buttonProps = $derived.by(() => {
    const extraProps = action.buttonOptions<ComponentProps>('button');

    return {
      ...extraProps,
      ...action.buttonAttributes,
      variant: extraProps.variant ?? mapButtonColorToShadcnVariant(binding.button.color),
      class: twMerge(
        'inline-flex items-center gap-2',
        toButtonSemanticColor(binding.button.color) === 'warning' && 'text-destructive',
        extraProps.class,
        binding.button.uischema.options?.fullWidth === true && 'w-full',
      ),
    };
  });
</script>

<ButtonActionContent {action} class={twMerge('w-full', styles.value?.control?.root)}>
  {#snippet button(label)}
    <Button {...buttonProps}>{@render label()}</Button>
  {/snippet}
</ButtonActionContent>
