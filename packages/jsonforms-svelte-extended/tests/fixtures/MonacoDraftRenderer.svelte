<script lang="ts">
  import { onMount } from 'svelte';
  import {
    useJsonForms,
    useJsonFormsControl,
    type ControlProps,
  } from '@chobantonov/jsonforms-svelte';
  import { useMonacoDraft } from '../../src/lib/core/monacoDraft.svelte';
  const props: ControlProps = $props();
  const binding = useJsonFormsControl(props);
  const jsonforms = useJsonForms();
  const draft = useMonacoDraft({
    get value() {
      return binding.control.data;
    },
    get schema() {
      return binding.control.schema;
    },
    get path() {
      return binding.control.path;
    },
    get language() {
      return props.uischema.options?.language ?? 'json';
    },
    get convertJson() {
      return props.uischema.options?.convertJson ?? true;
    },
    get enabled() {
      return binding.control.enabled;
    },
    get validateJsonSchema() {
      return props.uischema.options?.validateJsonSchema === true;
    },
    get propagateErrors() {
      return props.uischema.options?.propagateErrors === true;
    },
    get locale() {
      return jsonforms.i18n?.locale;
    },
    get translate() {
      return jsonforms.i18n?.translate;
    },
    onChange: (value) => binding.handleChange(binding.control.path, value),
  });
  onMount(() => props.uischema.options?.capture?.({ draft, jsonforms }));
</script>

<textarea value={draft.text} oninput={(event) => draft.update(event.currentTarget.value)}
></textarea>
<p>{draft.message}</p>
