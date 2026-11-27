<script lang="ts">
  import ColorPicker from './components/ColorPicker.svelte';
  import {
    type ControlProps,
    useJsonFormsControl,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { ColorError, useColorEditor } from '@chobantonov/jsonforms-svelte-extended';
  import {
    TooltipContent,
    ControlWrapper,
    determineClearValue,
    useShadcnControl,
    XIcon,
  } from '@chobantonov/jsonforms-svelte-shadcn';
  import { Button } from '@jsonforms-svelte-shadcn-ui/button';
  import * as Tooltip from '@jsonforms-svelte-shadcn-ui/tooltip';
  import { twMerge } from 'tailwind-merge';

  const props: ControlProps = $props();
  const clearValue = determineClearValue('');
  const binding = useShadcnControl(useJsonFormsControl(props), (value) => value || clearValue);

  const editor = useColorEditor(binding, clearValue);
  const textInputProps = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      ...editor.inputProps(binding, shadcnProps['aria-describedby']),
      class: twMerge(
        'border-input bg-background placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground h-9 w-full min-w-0 rounded-md border px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        binding.styles.control.input,
        shadcnProps.class,
        'ps-12',
        binding.clearable ? 'pe-10' : '',
      ),
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class={editor.profile.textEntry ? 'group relative w-full' : 'group relative h-9 w-24'}>
    {#if editor.profile.textEntry}<input {...textInputProps} data-slot="input" />{/if}

    <div class="absolute inset-y-0 start-1 my-auto h-7 w-9" data-color-picker-wrapper>
      <ColorPicker
        {...editor.pickerProps(
          binding.clearable,
          binding.handleFocus,
          textInputProps['aria-describedby'],
        )}
      />
    </div>

    {#if textInputProps.value !== '' && binding.clearable}
      <Tooltip.Provider
        ><Tooltip.Root
          ><Tooltip.Trigger>
            {#snippet child({ props: triggerProps })}
              <Button
                {...triggerProps}
                variant="ghost"
                size="icon-xs"
                class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
                disabled={!binding.control.enabled}
                onmousedown={(event: MouseEvent) => event.preventDefault()}
                onclick={editor.clearColor}
                aria-label={editor.message('clear')}
              >
                <XIcon class="size-4" />
              </Button>
            {/snippet}
          </Tooltip.Trigger><TooltipContent>{editor.message('clear')}</TooltipContent></Tooltip.Root
        ></Tooltip.Provider
      >
    {/if}
  </div>
  <ColorError {editor} id={binding.control.id} />
</ControlWrapper>
