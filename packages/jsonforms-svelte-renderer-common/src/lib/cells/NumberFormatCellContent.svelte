<script lang="ts">
  import type { Component, Snippet } from 'svelte';
  import type { ControlProps } from '../core/jsonFormsCompositions.svelte';
  import { useNumberFormatCell } from './numberFormatCell.svelte';

  const {
    CellContent,
    IntegerCell,
    Input,
    Textarea,
    clearButton,
    ...props
  }: ControlProps & {
    CellContent: Component<{ errors?: string; children: Snippet }>;
    IntegerCell: Component<ControlProps>;
    Input?: Component<
      ReturnType<typeof useNumberFormatCell>['inputProps'] & { type: 'text'; class: string }
    >;
    Textarea?: Component<ReturnType<typeof useNumberFormatCell>['inputProps'] & { class: string }>;
    clearButton: Snippet<
      [{ type: 'button'; disabled: boolean; 'aria-label': string; onclick(): void }]
    >;
  } = $props();
  const editor = useNumberFormatCell(props);
</script>

{#if editor.hasFormatter}
  {#if editor.visible}
    <CellContent errors={editor.errors}>
      <div class="group relative w-full">
        {#if editor.multiline}
          {#if Textarea}<Textarea class="pe-10" {...editor.inputProps} />{:else}
            <textarea class="textarea w-full pe-10" {...editor.inputProps}></textarea>
          {/if}
        {:else if Input}<Input type="text" class="pe-10" {...editor.inputProps} />
        {:else}<input type="text" class="input w-full pe-10" {...editor.inputProps} />{/if}
        {#if editor.helpMessage}
          <span id={editor.helpId} class="sr-only">{editor.helpMessage}</span>
        {/if}
        {#if editor.clearable}
          {@render clearButton({
            type: 'button',
            disabled: editor.inputProps.disabled || editor.inputProps.readonly,
            'aria-label': editor.clearLabel,
            onclick: editor.clear,
          })}
        {/if}
      </div>
    </CellContent>
  {/if}
{:else}
  <IntegerCell {...props} />
{/if}
