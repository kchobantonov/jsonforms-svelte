<script lang="ts">
  import { type RendererProps } from '@chobantonov/jsonforms-svelte';
  import {
    type ButtonElement,
    useFormContext,
    useJsonFormsButton,
  } from '../../src/lib/index.js';

  const props: RendererProps<ButtonElement> = $props();
  const binding = useJsonFormsButton(props);
  const formContext = useFormContext();

  async function click(event: MouseEvent) {
    const target = (event.currentTarget as HTMLButtonElement | null) ?? document.body;
    await formContext.fireActionEvent?.(
      binding.button.action ?? '',
      binding.button.params,
      target,
    );
  }
</script>

{#if binding.button.visible}
  <button type="button" onclick={click}>{binding.button.label}</button>
{/if}
