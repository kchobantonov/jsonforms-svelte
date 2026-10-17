<script lang="ts">
  import { onMount } from 'svelte';
  import {
    useJsonForms,
    useJsonFormsControl,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { useDurationDraft } from '../../src/lib/core/durationDraft.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const jsonforms = useJsonForms();
  const draft = useDurationDraft({
    get value() {
      return binding.control.data;
    },
    get schema() {
      return binding.control.schema;
    },
    get path() {
      return binding.control.path;
    },
    get enabled() {
      return binding.control.enabled;
    },
    get showActions() {
      return props.uischema.options?.showActions !== false;
    },
    clearValue: '',
    onChange: (value) => binding.handleChange(binding.control.path, value),
  });
  onMount(() => props.uischema.options?.capture?.({ draft, jsonforms }));
</script>

<input
  aria-label="Duration"
  value={draft.text}
  oninput={(event) => draft.update(event.currentTarget.value)}
/>
