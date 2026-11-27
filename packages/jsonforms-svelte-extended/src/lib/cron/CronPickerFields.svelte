<script lang="ts">
  import type { Component, ComponentProps, Snippet } from 'svelte';
  import { useRendererMessages } from '@chobantonov/jsonforms-svelte-renderer-common';
  import CronPicker from './CronPicker.svelte';
  type Picker = ComponentProps<typeof CronPicker>;
  const message = useRendererMessages();
  const {
    model,
    CronSelect,
    input: nativeInput,
    clear,
    button: nativeButton,
  }: {
    model: Picker['model'];
    CronSelect: Component<Parameters<Picker['select']>[0] & { disabled: boolean }>;
    input: Snippet<
      [
        {
          value: string;
          oninput(event: Event): void;
          'aria-label': string;
          'aria-invalid'?: boolean;
          disabled: boolean;
        },
      ]
    >;
    clear: Snippet<
      [string, { type: 'button'; onmousedown(event: MouseEvent): void; onclick(): void }]
    >;
    button: Snippet<[string, { type: 'button'; disabled: boolean; onclick(): void }]>;
  } = $props();
</script>

<CronPicker {model}>
  {#snippet select(props)}<CronSelect {...props} disabled={model.disabled} />{/snippet}
  {#snippet input(props)}
    <div class="grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-2 text-sm">
      <span>{props.label}</span>
      <div class="group/cron-expression relative min-w-0">
        {@render nativeInput({
          value: props.value,
          oninput: (event) => props.change((event.currentTarget as HTMLInputElement).value),
          'aria-label': props.label,
          'aria-invalid': props.invalid,
          disabled: model.disabled,
        })}
        {#if props.value !== '' && !model.disabled}
          {@render clear(`${message('control.clearValue')}: ${props.label}`, {
            type: 'button',
            onmousedown: (event) => event.preventDefault(),
            onclick: () => props.change(''),
          })}
        {/if}
      </div>
    </div>
  {/snippet}
  {#snippet button(props)}
    {@render nativeButton(props.label, {
      type: 'button',
      disabled: !!(model.disabled || props.disabled),
      onclick: props.click,
    })}
  {/snippet}
</CronPicker>
