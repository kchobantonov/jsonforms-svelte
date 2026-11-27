<script lang="ts">
  import InputClearButton from './components/InputClearButton.svelte';
  import { textInputAttributes } from '@chobantonov/jsonforms-svelte-renderer-common';

  import {
    useSuggestedTextInput,
    SuggestedTextField,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte-renderer-common';
  import { Input } from '@jsonforms-svelte-shadcn-ui/input';
  import { twMerge } from 'tailwind-merge';
  import { determineClearValue, useShadcnTextControl } from '../util';
  import ControlWrapper from './ControlWrapper.svelte';
  import MultiStringControlRenderer from './MultiStringControlRenderer.svelte';

  const { schemaSuggestions, ...props }: ControlProps & { schemaSuggestions: boolean } = $props();

  const clearValue = determineClearValue('');
  const { binding } = useShadcnTextControl(props, clearValue);

  const field = useSuggestedTextInput(binding, () => schemaSuggestions);
  const { text } = field;

  const inputprops = $derived.by(() => {
    const shadcnProps = binding.shadcnProps('input');
    return {
      ...shadcnProps,
      type: 'text',
      ...textInputAttributes(binding, text, shadcnProps['aria-describedby']),
      maxlength: undefined,
      class: twMerge(
        binding.styles.control.input,
        shadcnProps.class,
        binding.clearable ? 'pe-10' : '',
      ),
      value: text.value,
    };
  });
</script>

<SuggestedTextField
  {field}
  {...field.fieldProps(props, binding.controlWrapper)}
  {ControlWrapper}
  {MultiStringControlRenderer}
  {InputClearButton}
>
  <Input {...inputprops} list={field.datalistId} />
</SuggestedTextField>
