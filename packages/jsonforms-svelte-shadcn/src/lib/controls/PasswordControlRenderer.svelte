<script lang="ts">
  import { type ControlProps, useJsonFormsControl } from '@chobantonov/jsonforms-svelte';
  import { EyeIcon as EyeOutline, EyeOffIcon as EyeSlashOutline, XIcon } from '@lucide/svelte';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useShadcnControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';

  const props: ControlProps = $props();

  const clearValue = determineClearValue('');
  const adaptValue = (value: any) => value || clearValue;

  const binding = useShadcnControl(useJsonFormsControl(props), adaptValue, 300);
  let show = $state(false);

  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');

    return {
      ...shadcnProps,
      type: show ? 'text' : 'password',
      id: `${binding.control.id}-input`,
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
        'ps-9',
        binding.clearable ? 'pe-10' : '',
      ),
      disabled: !binding.control.enabled,
      autofocus: binding.appliedOptions.focus,
      placeholder: binding.appliedOptions.placeholder,
      value: binding.control.data,
      maxlength: binding.appliedOptions.restrict ? props.schema.maxLength : undefined,
      oninput: (e: Event) => binding.onChange((e.target as HTMLInputElement).value),
      onfocus: binding.handleFocus,
      onblur: binding.handleBlur,
      required: binding.control.required,
      'aria-invalid': !!binding.control.errors,
    };
  });
</script>

<ControlWrapper {...binding.controlWrapper}>
  <div class="group relative w-full">
    <Button
      variant="ghost"
      size="icon"
      onclick={() => (show = !show)}
      aria-label={show ? 'Hide password' : 'Show password'}
      class="absolute inset-y-0 start-1 my-auto"
    >
      {#if show}
        <EyeOutline class="h-5 w-5" />
      {:else}
        <EyeSlashOutline class="h-5 w-5" />
      {/if}
    </Button>
    <Input {...inputprops} />
    {#if binding.clearable && inputprops.value !== '' && inputprops.value !== undefined && inputprops.value !== null}
      <Button
        variant="ghost"
        size="icon-xs"
        class="absolute inset-y-0 end-1 my-auto opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
        onmousedown={(event: MouseEvent) => event.preventDefault()}
        onclick={() => binding.onChange(clearValue)}
        disabled={!binding.control.enabled}
        aria-label="Clear value"
      >
        <XIcon class="size-4" />
      </Button>
    {/if}
  </div>
</ControlWrapper>
